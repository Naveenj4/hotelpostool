import { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/dashboard/Sidebar';
import Header from '../../components/dashboard/Header';
import './Dashboard.css';
import {
    PlusCircle,
    Minus,
    Search,
    Edit,
    Trash,
    CheckCircle2,
    XCircle,
    Package,
    AlertCircle,
    Loader2,
    Plus,
    Trash2,
    Clock,
    Layers,
    ShoppingCart,
    Tag,
    Image as ImageIcon,
    Check,
    Download,
    Upload,
    Activity,
    ChevronRight,
    ArrowRight,
    Eye,
    EyeOff,
    Table,
    Truck,
    Users2
} from 'lucide-react';
import { TableSkeleton } from '../../components/Skeleton';

const ProductMaster = () => {
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDrawer, setShowDrawer] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [selectedBrand, setSelectedBrand] = useState('ALL');
    const [selectedFoodType, setSelectedFoodType] = useState('ALL');
    const fileInputRef = useRef(null);

    const initialFormState = {
        code: '',
        barcode: '',
        name: '',
        short_name: '',
        print_name: '',
        category: '',
        brand: '',
        food_type: 'NONE',
        item_nature: 'GOOD',
        product_type: 'BUY_SELL',
        // IMPORTANT: store as strings so inputs never get stuck at '0'
        purchase_price: '',
        cost_price: '',
        selling_price: '',
        mrp: '',
        gst_sales: '',
        gst_purchase: '',
        hsn_code: '',
        unit: '',
        opening_stock: '',
        min_stock: '',
        max_stock: '',
        reorder_level: '',
        urgent_order_level: '',
        available_timings: [
            { label: 'Morning', start_time: '08:00', end_time: '12:00', enabled: true },
            { label: 'Afternoon', start_time: '12:00', end_time: '16:00', enabled: true },
            { label: 'Evening', start_time: '16:00', end_time: '23:00', enabled: true }
        ],
        addons: [],
        variations: [],
        serve_types: {
            dine_in: true,
            delivery: true,
            pickup: true,
            party_order: true
        },
        image: '',
        online_order: false,
        is_active: true
    };

    const [formData, setFormData] = useState(initialFormState);

    const getBaseUrl = () => {
        const fullUrl = import.meta.env.VITE_API_URL;
        return fullUrl.replace('/api', '');
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const savedUser = localStorage.getItem('user');
            if (!savedUser) return;
            const { token } = JSON.parse(savedUser);
            const headers = { 'Authorization': `Bearer ${token}` };

            const [prodRes, catRes, brandRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/products`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL}/categories`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL}/brands`, { headers })
            ]);

            const prodData = await prodRes.json();
            const catData = await catRes.json();
            const brandData = await brandRes.json();

            if (prodData.success) setProducts(prodData.data);
            if (catData.success) setCategories(catData.data);
            if (brandData.success) setBrands(brandData.data);

        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const exportCSV = () => {
        if (!products.length) return;
        
        // Define columns matching the creation form precisely
        const columns = [
            { header: 'Item Name', key: 'name' },
            { header: 'Item Code', key: 'code' },
            { header: 'Barcode', key: 'barcode' },
            { header: 'Short Name', key: 'short_name' },
            { header: 'Print Name', key: 'print_name' },
            { header: 'Category', key: 'category' },
            { header: 'Brand', key: 'brand' },
            { header: 'Food Type', key: 'food_type' },
            { header: 'Item Nature', key: 'item_nature' },
            { header: 'Product Type', key: 'product_type' },
            { header: 'Unit', key: 'unit' },
            { header: 'Purchase Rate', key: 'purchase_price' },
            { header: 'Cost Rate', key: 'cost_price' },
            { header: 'Selling Price', key: 'selling_price' },
            { header: 'MRP', key: 'mrp' },
            { header: 'GST Purchase %', key: 'gst_purchase' },
            { header: 'GST Sales %', key: 'gst_sales' },
            { header: 'HSN Code', key: 'hsn_code' },
            { header: 'Opening Stock', key: 'opening_stock' },
            { header: 'Stock Value', key: 'stock_value' },
            { header: 'Max Stock', key: 'max_stock' },
            { header: 'Min Stock', key: 'min_stock' },
            { header: 'Reorder Level', key: 'reorder_level' },
            { header: 'Urgent Level', key: 'urgent_order_level' },
            { header: 'Dine In', get: (p) => p.serve_types?.dine_in ? 'YES' : 'NO' },
            { header: 'Delivery', get: (p) => p.serve_types?.delivery ? 'YES' : 'NO' },
            { header: 'Pickup', get: (p) => p.serve_types?.pickup ? 'YES' : 'NO' },
            { header: 'Party Order', get: (p) => p.serve_types?.party_order ? 'YES' : 'NO' },
            { header: 'Variations', get: (p) => p.variations?.map(v => `${v.name}(${v.amount})`).join(' | ') || '' },
            { header: 'Addons', get: (p) => p.addons?.map(a => `${a.name}(${a.rate})`).join(' | ') || '' },
            { header: 'Online Order', get: (p) => p.online_order ? 'YES' : 'NO' },
            { header: 'Active Status', get: (p) => p.is_active ? 'ACTIVE' : 'INACTIVE' }
        ];

        let csvContent = "\uFEFF"; // Add BOM for Excel UTF-8 support
        
        // Add Headers row
        csvContent += columns.map(c => `"${c.header}"`).join(',') + '\n';
        
        // Add Data rows
        products.forEach(p => {
            const row = columns.map(col => {
                let cellData = col.get ? col.get(p) : (p[col.key] || '');
                // Escape quotes and wrap in quotes to handle commas and newlines
                cellData = String(cellData).replace(/"/g, '""');
                return `"${cellData}"`;
            });
            csvContent += row.join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "Enterprise_Product_Master.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleCSVImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLoading(true);

        const parseCSVLine = (text) => {
            const result = [];
            let cur = '', inQuote = false;
            for (let i = 0; i < text.length; i++) {
                const c = text[i];
                if (c === '"') {
                    if (inQuote && text[i + 1] === '"') { cur += '"'; i++; }
                    else { inQuote = !inQuote; }
                } else if (c === ',' && !inQuote) {
                    result.push(cur);
                    cur = '';
                } else {
                    cur += c;
                }
            }
            result.push(cur);
            return result;
        };

        const reader = new FileReader();
        reader.onload = async (event) => {
            let text = event.target.result;
            if (text.charCodeAt(0) === 0xFEFF) text = text.substring(1); // Remove BOM
            
            const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
            if (lines.length < 2) {
                alert("File is empty or invalid format");
                setLoading(false);
                return;
            }

            const headers = parseCSVLine(lines[0]).map(h => h.trim());
            
            const colMap = {
                'Item Name': 'name', 'Item Code': 'code', 'Barcode': 'barcode',
                'Short Name': 'short_name', 'Print Name': 'print_name',
                'Category': 'category', 'Brand': 'brand', 'Food Type': 'food_type',
                'Item Nature': 'item_nature', 'Product Type': 'product_type',
                'Unit': 'unit', 'Purchase Rate': 'purchase_price', 'Cost Rate': 'cost_price',
                'Selling Price': 'selling_price', 'MRP': 'mrp', 'GST Purchase %': 'gst_purchase',
                'GST Sales %': 'gst_sales', 'HSN Code': 'hsn_code', 'Opening Stock': 'opening_stock',
                'Stock Value': 'stock_value', 'Max Stock': 'max_stock', 'Min Stock': 'min_stock',
                'Reorder Level': 'reorder_level', 'Urgent Level': 'urgent_order_level'
            };

            const parseExtras = (str) => {
                if (!str || !str.trim()) return [];
                return str.split('|').map(s => {
                    let name = s.trim();
                    let amount = 0;
                    const match = name.match(/^(.*?)\(([\d.]+)\)$/);
                    if (match) {
                        name = match[1].trim();
                        amount = parseFloat(match[2]) || 0;
                    }
                    return { name, amount, rate: amount };
                }).filter(x => x.name);
            };

            const parseBool = (str) => /^(YES|ACTIVE|TRUE|1)$/i.test((str||'').trim());

            const items = lines.slice(1).map(line => {
                const values = parseCSVLine(line);
                const obj = JSON.parse(JSON.stringify(initialFormState)); // Deep copy 

                headers.forEach((h, i) => {
                    let val = (values[i] || '').trim();
                    if (colMap[h]) {
                        const key = colMap[h];
                        // Convert numeric fields
                        const numFields = ['purchase_price', 'cost_price', 'selling_price', 'mrp', 'gst_purchase', 'gst_sales', 'opening_stock', 'stock_value', 'max_stock', 'min_stock', 'reorder_level', 'urgent_order_level'];
                        if (numFields.includes(key)) {
                            obj[key] = parseFloat(val) || 0;
                        } else {
                            obj[key] = val;
                        }
                    } else {
                        // Custom Handlers
                        if (h === 'Dine In') obj.serve_types.dine_in = parseBool(val);
                        if (h === 'Delivery') obj.serve_types.delivery = parseBool(val);
                        if (h === 'Pickup') obj.serve_types.pickup = parseBool(val);
                        if (h === 'Party Order') obj.serve_types.party_order = parseBool(val);
                        if (h === 'Online Order') obj.online_order = parseBool(val);
                        if (h === 'Active Status') obj.is_active = parseBool(val);
                        
                        if (h === 'Variations') {
                            obj.variations = parseExtras(val).map(v => ({ name: v.name, amount: v.amount }));
                        }
                        if (h === 'Addons') {
                            obj.addons = parseExtras(val).map(a => ({ name: a.name, rate: a.rate }));
                        }
                    }
                });
                return obj;
            }).filter(i => i.name);

            if (items.length === 0) {
                alert("No valid items found to import. Make sure Item Name is provided.");
                setLoading(false);
                return;
            }

            try {
                const savedUser = localStorage.getItem('user');
                const { token } = JSON.parse(savedUser);

                let successCount = 0;
                let failCount = 0;
                
                // Process sequentially or chunks to avoid overwhelming the server
                for (const item of items) {
                    try {
                        const res = await fetch(`${import.meta.env.VITE_API_URL}/products`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify(item)
                        });
                        if (res.ok) successCount++;
                        else failCount++;
                    } catch(err) {
                        failCount++;
                    }
                }
                
                alert(`Import Complete:\nSuccessfully Imported: ${successCount}\nFailed: ${failCount}`);
                fetchData();
            } catch (err) {
                alert("Import process failed: " + err.message);
            } finally {
                setLoading(false);
                // Reset file input
                if (e.target) e.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    // Live computed stock value — shown in disabled Asset Value field
    const computedStockValue = ((parseFloat(formData.purchase_price) || 0) * (parseFloat(formData.opening_stock) || 0)).toFixed(2);

    // Simple handleInputChange — stores raw string for ALL fields.
    // Number fields are kept as strings during editing to prevent the
    // React controlled-input "stuck at 0" bug where typing '5' into a
    // field showing 0 produces no state change and the input won't update.
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked }));
            return;
        }

        // Handle specific fields
        if (name === 'category') {
            const selectedCat = categories.find(c => c.name === value);
            setFormData(prev => ({
                ...prev,
                [name]: value,
                hsn_code: selectedCat?.hsn_code || ''
            }));
            return;
        }

        // Numeric fields filtering logic
        const numberFields = ['purchase_price','cost_price','selling_price','mrp','gst_sales','gst_purchase','opening_stock','min_stock','max_stock','reorder_level','urgent_order_level'];
        if (numberFields.includes(name)) {
            // Only allow numbers, decimals, and empty strings
            const sanitizedValue = value.replace(/[^0-9.]/g, '');
            // Prevent multiple decimal points
            const parts = sanitizedValue.split('.');
            if (parts.length > 2) return; 
            
            setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
            return;
        }

        // Store raw value for everything else
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleServeTypeChange = (type) => {
        setFormData(prev => ({
            ...prev,
            serve_types: { ...prev.serve_types, [type]: !prev.serve_types[type] }
        }));
    };

    const handleAddAddon = () => {
        setFormData(prev => ({ ...prev, addons: [...prev.addons, { name: '', rate: 0 }] }));
    };

    const handleAddonChange = (index, field, value) => {
        const newAddons = [...formData.addons];
        newAddons[index][field] = value;
        setFormData(prev => ({ ...prev, addons: newAddons }));
    };

    const handleRemoveAddon = (index) => {
        setFormData(prev => ({ ...prev, addons: prev.addons.filter((_, i) => i !== index) }));
    };

    const handleAddVariation = () => {
        setFormData(prev => ({ ...prev, variations: [...prev.variations, { name: '', amount: 0 }] }));
    };

    const handleVariationChange = (index, field, value) => {
        const newVars = [...formData.variations];
        newVars[index][field] = value;
        setFormData(prev => ({ ...prev, variations: newVars }));
    };

    const handleRemoveVariation = (index) => {
        setFormData(prev => ({ ...prev, variations: prev.variations.filter((_, i) => i !== index) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);

            // Sanitize: ensure all number fields are actual numbers (not empty strings)
            const numberFields = ['purchase_price','cost_price','selling_price','mrp','gst_sales','gst_purchase','opening_stock','min_stock','max_stock','reorder_level','urgent_order_level'];
            const sanitizedData = { ...formData };
            numberFields.forEach(f => {
                sanitizedData[f] = parseFloat(sanitizedData[f]) || 0;
            });
            // Update stock_value based on sanitized values
            sanitizedData.stock_value = (sanitizedData.purchase_price * sanitizedData.opening_stock);

            const url = isEditing
                ? `${import.meta.env.VITE_API_URL}/products/${formData._id}`
                : `${import.meta.env.VITE_API_URL}/products`;

            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(sanitizedData)
            });

            const result = await response.json();
            if (!result.success) throw new Error(result.message);

            alert(isEditing ? 'Product Master updated successfully!' : 'New Product created successfully in Master!');
            fetchData();
            setShowDrawer(false);
            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const fData = new FormData();
        fData.append('image', file);
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/products/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: fData
            });
            const result = await response.json();
            if (result.success) {
                setFormData(prev => ({ ...prev, image: result.data }));
            } else {
                throw new Error(result.message || 'Unknown upload error');
            }
        } catch (err) {
            console.error("Upload Error:", err);
            setError('Upload failed: ' + err.message);
            alert('Upload failed: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleEdit = (product) => {
        const numFields = ['purchase_price','cost_price','selling_price','mrp','gst_sales','gst_purchase','opening_stock','min_stock','max_stock','reorder_level','urgent_order_level'];
        const productAsStrings = { ...product };
        numFields.forEach(f => {
            // Convert number from DB to string for form (e.g. 150 → '150', 0 → '')
            const v = product[f];
            productAsStrings[f] = (v === 0 || v === null || v === undefined) ? '' : String(v);
        });
        setFormData({ ...initialFormState, ...productAsStrings, serve_types: product.serve_types || initialFormState.serve_types });
        setIsEditing(true);
        setShowDrawer(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this master item?")) return;
        try {
            const savedUser = localStorage.getItem('user');
            const { token } = JSON.parse(savedUser);
            await fetch(`${import.meta.env.VITE_API_URL}/products/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const resetForm = () => {
        setFormData(initialFormState);
        setIsEditing(false);
        setError('');
    };

    const toggleSidebar = () => {
        if (window.innerWidth <= 768) setIsMobileSidebarOpen(!isMobileSidebarOpen);
        else {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            localStorage.setItem('sidebarCollapsed', newState);
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch =
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
        const matchesBrand = selectedBrand === 'ALL' || (p.brand || 'No Brand') === selectedBrand;
        const matchesFoodType = selectedFoodType === 'ALL' || p.food_type === selectedFoodType;

        return matchesSearch && matchesCategory && matchesBrand && matchesFoodType;
    });

    return (
        <div className="dashboard-layout">
            <Sidebar isCollapsed={isCollapsed} isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

            {isMobileSidebarOpen && window.innerWidth <= 768 && (
                <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
            )}

            <main className="dashboard-main">
                <Header 
                    toggleSidebar={toggleSidebar} 
                    title="Item Creation"
                    actions={
                        <>
                            <label className="btn-premium-outline cursor-pointer border-dashed !py-2 !px-4">
                                <Upload size={16} />
                                <span className="text-[10px] uppercase font-black">Bulk Deployment</span>
                                <input type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
                            </label>
                            <button className="btn-premium-outline !py-2 !px-4" onClick={exportCSV}>
                                <Download size={16} />
                                <span className="text-[10px] uppercase font-black">Archive Export</span>
                            </button>
                            <button className="btn-premium-primary !py-2 !px-6" onClick={() => { resetForm(); setShowDrawer(true); }}>
                                <PlusCircle size={18} /> 
                                <span className="text-[10px] uppercase font-black">Add New Item</span>
                            </button>
                        </>
                    }
                />
                <div className="master-content-layout fade-in">
                    {/* Header moved to global Header component */}


                    <div className="toolbar-premium">
                        <div className="flex flex-row items-center gap-4 flex-1">
                            <div className="search-premium" style={{ width: '400px', flexShrink: 0 }}>
                                <Search size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by Name, Code, Barcode..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-row gap-2">
                                <select
                                    className="filter-select-premium"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    <option value="ALL">ALL CATEGORIES</option>
                                    {categories.map(cat => (
                                        <option key={cat._id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>

                                <select
                                    className="filter-select-premium"
                                    value={selectedBrand}
                                    onChange={(e) => setSelectedBrand(e.target.value)}
                                >
                                    <option value="ALL">ALL BRANDS</option>
                                    {brands.map(brand => (
                                        <option key={brand._id} value={brand.name}>{brand.name}</option>
                                    ))}
                                </select>

                                <select
                                    className="filter-select-premium"
                                    value={selectedFoodType}
                                    onChange={(e) => setSelectedFoodType(e.target.value)}
                                >
                                    <option value="ALL">ANY FOOD TYPE</option>
                                    <option value="VEG">VEG</option>
                                    <option value="NON_VEG">NON-VEG</option>
                                    <option value="NONE">NONE</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col items-end flex-shrink-0">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Registry</span>
                            <span className="text-xl font-black text-slate-800">{filteredProducts.length} <span className="text-xs text-slate-300">Units</span></span>
                        </div>
                    </div>

                    <div className="table-container-premium" style={{ overflowX: 'auto', maxWidth: '100%', borderRadius: '1rem', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <table className="modern-table-premium" style={{ minWidth: '4500px', width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    <th className="sticky-col left-0" style={{ background: '#f8fafc', zIndex: 20 }}>Item Name</th>
                                    <th>Item Code</th>
                                    <th>Barcode</th>
                                    <th>Category</th>
                                    <th>Brand</th>
                                    <th>Food Type</th>
                                    <th>Unit</th>
                                    <th>Purchase Rate</th>
                                    <th>Cost Rate</th>
                                    <th>MRP</th>
                                    <th>Sales Rate</th>
                                    <th>GST Purchase (%)</th>
                                    <th>GST Sales (%)</th>
                                    <th>Dine In</th>
                                    <th>Pickup</th>
                                    <th>Delivery</th>
                                    <th>Party Order</th>
                                    <th>Opening Stock</th>
                                    <th>Stock Value</th>
                                    <th>Maximum</th>
                                    <th>Minimum</th>
                                    <th>Re-order</th>
                                    <th>Urgent</th>
                                    <th>Variations (e.g. Small, Medium, Large)</th>
                                    <th>Addons (Extras like Cheese)</th>
                                    <th>Morning (Begin)</th>
                                    <th>Morning (Terminate)</th>
                                    <th>Afternoon (Begin)</th>
                                    <th>Afternoon (Terminate)</th>
                                    <th>Evening (Begin)</th>
                                    <th>Evening (Terminate)</th>
                                    <th>Status (Active/Halted)</th>
                                    <th className="sticky-col right-0" style={{ background: '#f8fafc', zIndex: 20, textAlign: 'right' }}>Management</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="33" style={{ textAlign: 'center', padding: '100px 0' }}>
                                            <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
                                            <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Accessing Data Cluster...</p>
                                        </td>
                                    </tr>
                                ) : filteredProducts.map(p => (
                                    <tr key={p._id} className={`group hover:bg-slate-50 transition-all ${!p.is_active ? 'opacity-60 grayscale-[0.8] bg-slate-50/50' : ''}`}>
                                        <td className="sticky-col left-0 group-hover:bg-slate-50 font-black text-slate-800 uppercase tracking-tighter text-sm" style={{ background: !p.is_active ? '#f8fafc' : 'white', zIndex: 10 }}>{p.name}</td>
                                        <td className="text-[10px] font-black text-slate-400 tracking-tighter uppercase">{p.code || 'Auto'}</td>
                                        <td className="text-slate-400 text-[10px] font-bold">{p.barcode || '-'}</td>
                                        <td><span className={`badge-premium ${p.is_active ? 'active' : 'disabled'} !text-[10px] uppercase font-black tracking-[0.15em]`}>{p.category}</span></td>
                                        <td className="text-slate-600 text-xs font-black uppercase tracking-tighter">{p.brand || '-'}</td>
                                        <td>
                                            {p.food_type !== 'NONE' ? (
                                                <span className={`text-[10px] font-black py-1 px-2 rounded-lg border ${p.food_type === 'VEG' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                    {p.food_type}
                                                </span>
                                            ) : <span className="text-slate-200">-</span>}
                                        </td>
                                        <td className="text-slate-600 font-black uppercase text-xs tracking-widest">{p.unit || '-'}</td>
                                        <td className="font-black text-rose-500 text-sm">₹{p.purchase_price}</td>
                                        <td className="font-black text-rose-500 text-sm">₹{p.cost_price}</td>
                                        <td className="font-black text-slate-700 text-sm">₹{p.mrp}</td>
                                        <td className="font-black text-indigo-600 text-sm">₹{p.selling_price}</td>
                                        <td className="text-slate-600 font-bold text-xs">{p.gst_purchase}%</td>
                                        <td className="text-slate-600 font-bold text-xs">{p.gst_sales}%</td>
                                        <td className={`text-[10px] font-black uppercase ${p.serve_types?.dine_in ? 'text-emerald-500' : 'text-slate-300'}`}>{p.serve_types?.dine_in ? 'YES' : 'NO'}</td>
                                        <td className={`text-[10px] font-black uppercase ${p.serve_types?.pickup ? 'text-emerald-500' : 'text-slate-300'}`}>{p.serve_types?.pickup ? 'YES' : 'NO'}</td>
                                        <td className={`text-[10px] font-black uppercase ${p.serve_types?.delivery ? 'text-emerald-500' : 'text-slate-300'}`}>{p.serve_types?.delivery ? 'YES' : 'NO'}</td>
                                        <td className={`text-[10px] font-black uppercase ${p.serve_types?.party_order ? 'text-emerald-500' : 'text-slate-300'}`}>{p.serve_types?.party_order ? 'YES' : 'NO'}</td>
                                        <td className="text-slate-600 font-black text-xs text-center">{p.opening_stock}</td>
                                        <td className="font-black text-emerald-600 text-xs text-center">₹{p.stock_value}</td>
                                        <td className="text-slate-500 font-black text-xs text-center">{p.max_stock}</td>
                                        <td className="text-slate-500 font-black text-xs text-center">{p.min_stock}</td>
                                        <td className="text-rose-400 font-black text-xs text-center">{p.reorder_level}</td>
                                        <td className="text-rose-600 font-black text-xs text-center">{p.urgent_order_level}</td>
                                        <td>
                                            <div className="flex flex-wrap gap-1 max-w-[300px]">
                                                {p.variations?.map((v, i) => (
                                                    <span key={i} className="text-[9px] font-black uppercase bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200">{v.name} (+₹{v.amount})</span>
                                                )) || <span className="text-slate-200">No Variations</span>}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex flex-wrap gap-1 max-w-[300px]">
                                                {p.addons?.map((a, i) => (
                                                    <span key={i} className="text-[9px] font-black uppercase bg-indigo-50 text-indigo-600 px-2 py-1 rounded border border-indigo-100">{a.name} (₹{a.rate})</span>
                                                )) || <span className="text-slate-200">No Addons</span>}
                                            </div>
                                        </td>
                                        <td className="text-[10px] font-black text-indigo-500 uppercase">{p.available_timings?.[0]?.enabled ? p.available_timings[0].start_time : '-'}</td>
                                        <td className="text-[10px] font-black text-indigo-500 uppercase">{p.available_timings?.[0]?.enabled ? p.available_timings[0].end_time : '-'}</td>
                                        <td className="text-[10px] font-black text-indigo-500 uppercase">{p.available_timings?.[1]?.enabled ? p.available_timings[1].start_time : '-'}</td>
                                        <td className="text-[10px] font-black text-indigo-500 uppercase">{p.available_timings?.[1]?.enabled ? p.available_timings[1].end_time : '-'}</td>
                                        <td className="text-[10px] font-black text-indigo-500 uppercase">{p.available_timings?.[2]?.enabled ? p.available_timings[2].start_time : '-'}</td>
                                        <td className="text-[10px] font-black text-indigo-500 uppercase">{p.available_timings?.[2]?.enabled ? p.available_timings[2].end_time : '-'}</td>
                                        <td>
                                            <span className={`badge-premium ${p.is_active ? 'active' : 'disabled'} !text-[10px] font-black tracking-[0.2em]`}>
                                                {p.is_active ? 'OPERATIONAL' : 'DEACTIVATED'}
                                            </span>
                                        </td>
                                        <td className="sticky-col right-0 group-hover:bg-slate-50" style={{ background: !p.is_active ? '#f8fafc' : 'white', zIndex: 10 }}>
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => p.is_active && handleEdit(p)} className={`action-icon-btn edit shadow-sm scale-75 ${!p.is_active ? 'cursor-not-allowed opacity-30 shadow-none' : ''}`} disabled={!p.is_active}><Edit size={18} /></button>
                                                <button onClick={() => handleDelete(p._id)} className={`action-icon-btn delete shadow-sm scale-75 ${!p.is_active ? 'cursor-not-allowed opacity-30 shadow-none' : ''}`} disabled={!p.is_active}><Trash size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {showDrawer && (
                    <>
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[999] animate-in fade-in transition-all" onClick={() => setShowDrawer(false)}></div>
                        <div className="drawer-premium !max-w-[1000px]">
                            <div className="drawer-header">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="p-1 bg-indigo-100 rounded text-indigo-600">
                                            <Package size={14} />
                                        </div>
                                        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-widest">Item Architect</span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-800">{isEditing ? 'Reconfigure Master' : 'Create New Item'}</h3>
                                </div>
                                <button onClick={() => setShowDrawer(false)} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-rose-500 flex items-center justify-center transition-all">
                                    <XCircle size={24} />
                                </button>
                            </div>
                            <div className="drawer-body">
                                {error && (
                                    <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center gap-3 text-rose-700 font-medium text-sm mb-6 shadow-sm">
                                        <AlertCircle size={20} />
                                        {error}
                                    </div>
                                )}

                                <form id="product-form" onSubmit={handleSubmit} className="space-y-8 pb-10">
                                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
                                        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                                            <Layers className="text-indigo-600" size={20} />
                                            <h4 className="text-lg font-bold text-slate-800">Primary Product Configuration</h4>
                                        </div>
                                        <div className="flex flex-col lg:flex-row gap-8">
                                            {/* Image Upload Column */}
                                            <div className="flex flex-col items-center">
                                                <div
                                                    className="w-48 h-48 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center relative group overflow-hidden cursor-pointer hover:border-indigo-400 transition-all"
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    {formData.image ? (
                                                        <img src={`${getBaseUrl()}${formData.image}`} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                    ) : (
                                                        <div className="text-center p-4">
                                                            <ImageIcon size={40} className="text-slate-300 mx-auto mb-2" />
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tap to Upload<br />Product Photo</p>
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                                                        <div className="text-center group-hover:translate-y-0 translate-y-2 transition-transform">
                                                            <Upload size={24} className="text-white mx-auto mb-1" />
                                                            <span className="text-white font-bold text-[10px] uppercase tracking-widest">Update Photo</span>
                                                        </div>
                                                    </div>
                                                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                                </div>
                                                <div className="mt-4 flex gap-4 w-full">
                                                    <div className="flex-1 p-2 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Online</span>
                                                        <label className="relative inline-flex items-center cursor-pointer scale-75">
                                                            <input type="checkbox" className="sr-only peer" checked={formData.online_order} onChange={(e) => setFormData(p => ({ ...p, online_order: e.target.checked }))} />
                                                            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                                        </label>
                                                    </div>
                                                    <div className="flex-1 p-2 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Active</span>
                                                        <label className="relative inline-flex items-center cursor-pointer scale-75">
                                                            <input type="checkbox" className="sr-only peer" checked={formData.is_active} onChange={(e) => setFormData(p => ({ ...p, is_active: e.target.checked }))} />
                                                            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Form Fields Column */}
                                            <div className="flex-1">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                                                    <div className="form-group-premium">
                                                        <label className="text-sm font-bold text-slate-700 mb-3 block flex items-center gap-2">
                                                            <div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
                                                            Item Identity <span className="text-rose-500 font-bold">*</span>
                                                        </label>
                                                        <div className="relative group">
                                                            <Package size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                                            <input type="text" name="name" required className="input-premium-modern !pl-14 w-full text-lg font-bold" placeholder="Traditional Margherita" value={formData.name} onChange={handleInputChange} />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-6">
                                                        <div className="form-group-premium">
                                                            <label className="text-sm font-bold text-slate-700 mb-3 block">SKU / Code</label>
                                                            <div className="relative group">
                                                                <Layers size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                                                <input type="text" name="code" className="input-premium-modern !pl-12 w-full text-base font-semibold" placeholder="AUTO" value={formData.code} onChange={handleInputChange} />
                                                            </div>
                                                        </div>
                                                        <div className="form-group-premium">
                                                            <label className="text-sm font-bold text-slate-700 mb-3 block">Barcode Registry</label>
                                                            <div className="relative group">
                                                                <Activity size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                                                <input type="text" name="barcode" className="input-premium-modern !pl-12 w-full text-base font-semibold" placeholder="SCAN" value={formData.barcode} onChange={handleInputChange} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                                    <div className="form-group-premium">
                                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Category Selection <span className="text-rose-500">*</span></label>
                                                        <select name="category" required className="input-premium-modern w-full text-base font-bold text-slate-700" value={formData.category} onChange={handleInputChange}>
                                                            <option value="">Choose Class</option>
                                                            {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="form-group-premium">
                                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Brand Lineage</label>
                                                        <select name="brand" className="input-premium-modern w-full text-base font-bold text-slate-700" value={formData.brand} onChange={handleInputChange}>
                                                            <option value="">Generic / Custom</option>
                                                            {brands.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="form-group-premium">
                                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Food Classification</label>
                                                        <div className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
                                                            <button type="button" onClick={() => setFormData(p => ({ ...p, food_type: 'VEG' }))} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${formData.food_type === 'VEG' ? 'bg-white text-emerald-600 shadow-xl border border-emerald-100' : 'text-slate-400 hover:text-emerald-600'}`}>
                                                                <div className={`w-2.5 h-2.5 rounded-full ${formData.food_type === 'VEG' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div> VEG
                                                            </button>
                                                            <button type="button" onClick={() => setFormData(p => ({ ...p, food_type: 'NON_VEG' }))} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${formData.food_type === 'NON_VEG' ? 'bg-white text-rose-600 shadow-xl border border-rose-100' : 'text-slate-400 hover:text-rose-600'}`}>
                                                                <div className={`w-2.5 h-2.5 rounded-full ${formData.food_type === 'NON_VEG' ? 'bg-rose-500' : 'bg-slate-300'}`}></div> NON
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="form-group-premium">
                                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Fiscal HSN</label>
                                                        <input type="text" name="hsn_code" className="input-premium-modern w-full text-base font-bold" placeholder="HSN-8821" value={formData.hsn_code} onChange={handleInputChange} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
                                        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                                            <Activity className="text-indigo-600" size={20} />
                                            <h4 className="text-lg font-bold text-slate-800">Service Accessibility</h4>
                                        </div>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                            {[
                                                { id: 'dine_in', label: 'Dine In' },
                                                { id: 'pickup', label: 'Pickup' },
                                                { id: 'delivery', label: 'Delivery' },
                                                { id: 'party_order', label: 'Party Order' }
                                            ].map(type => (
                                                <label key={type.id} className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl border border-slate-50 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all">
                                                    <div className="relative flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={formData.serve_types?.[type.id]}
                                                            onChange={() => handleServeTypeChange(type.id)}
                                                        />
                                                        <div className="w-5 h-5 border-2 border-slate-300 rounded-md group-hover:border-indigo-400 peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all flex items-center justify-center">
                                                            <Check size={14} className={`text-white transition-opacity ${formData.serve_types?.[type.id] ? 'opacity-100' : 'opacity-0'}`} />
                                                        </div>
                                                    </div>
                                                    <span className="text-xs font-black text-slate-600 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">{type.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                                                <Tag className="text-indigo-600" size={20} />
                                                <h4 className="text-lg font-bold text-slate-800">Pricing Details</h4>
                                            </div>
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                                                <div className="form-group-premium">
                                                    <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">Rate (Buy)</label>
                                                    <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 overflow-hidden focus-within:border-indigo-400 transition-all">
                                                        <span className="px-3 text-slate-400 font-bold bg-slate-100 border-r border-slate-200">₹</span>
                                                        <input type="text" inputMode="decimal" name="purchase_price" placeholder="0" className="w-full py-3 px-3 text-base font-black text-slate-700 bg-transparent outline-none" value={formData.purchase_price} onChange={handleInputChange} />
                                                    </div>
                                                </div>
                                                <div className="form-group-premium">
                                                    <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">Net Cost</label>
                                                    <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 overflow-hidden focus-within:border-indigo-400 transition-all">
                                                        <span className="px-3 text-slate-400 font-bold bg-slate-100 border-r border-slate-200">₹</span>
                                                        <input type="text" inputMode="decimal" name="cost_price" placeholder="0" className="w-full py-3 px-3 text-base font-black text-slate-700 bg-transparent outline-none" value={formData.cost_price} onChange={handleInputChange} />
                                                    </div>
                                                </div>
                                                <div className="form-group-premium">
                                                    <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest">Max (MRP)</label>
                                                    <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 overflow-hidden focus-within:border-indigo-400 transition-all">
                                                        <span className="px-3 text-slate-400 font-bold bg-slate-100 border-r border-slate-200">₹</span>
                                                        <input type="text" inputMode="decimal" name="mrp" placeholder="0" className="w-full py-3 px-3 text-base font-black text-slate-700 bg-transparent outline-none" value={formData.mrp} onChange={handleInputChange} />
                                                    </div>
                                                </div>
                                                <div className="form-group-premium">
                                                    <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest text-indigo-600">Sale Price *</label>
                                                    <div className="flex items-center bg-indigo-50/30 rounded-xl border border-indigo-100 overflow-hidden focus-within:border-indigo-400 transition-all shadow-sm">
                                                        <span className="px-3 text-indigo-400 font-black bg-indigo-50 border-r border-indigo-100">₹</span>
                                                        <input type="text" inputMode="decimal" name="selling_price" required placeholder="0" className="w-full py-3 px-3 text-base font-black text-indigo-600 bg-transparent outline-none" value={formData.selling_price} onChange={handleInputChange} />
                                                    </div>
                                                </div>
                                                <div className="form-group-premium">
                                                    <label className="text-xs font-bold text-slate-500 mb-2 block tracking-wider">TAX (P) %</label>
                                                    <input type="text" inputMode="decimal" name="gst_purchase" placeholder="0" className="w-full py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 text-base font-bold text-slate-600 outline-none focus:border-indigo-400" value={formData.gst_purchase} onChange={handleInputChange} />
                                                </div>
                                                <div className="form-group-premium">
                                                    <label className="text-xs font-bold text-slate-500 mb-2 block tracking-wider">TAX (S) %</label>
                                                    <input type="text" inputMode="decimal" name="gst_sales" placeholder="0" className="w-full py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 text-base font-bold text-slate-600 outline-none focus:border-indigo-400" value={formData.gst_sales} onChange={handleInputChange} />
                                                </div>
                                                <div className="form-group-premium">
                                                    <label className="text-xs font-bold text-slate-500 mb-2 block tracking-wider">Measure (Unit)</label>
                                                    <input type="text" name="unit" className="input-premium-modern w-full text-base font-bold uppercase" placeholder="PCS / KG" value={formData.unit} onChange={handleInputChange} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                                                <ShoppingCart className="text-indigo-600" size={20} />
                                                <h4 className="text-lg font-bold text-slate-800">Stock Details & Level</h4>
                                            </div>
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-100">
                                                <div className="form-group-premium">
                                                    <label className="text-xs font-bold text-slate-500 mb-3 block uppercase tracking-wide">Opening Vol.</label>
                                                    <input type="text" inputMode="decimal" name="opening_stock" placeholder="0" className="input-premium-modern w-full text-base font-black relative z-10" value={formData.opening_stock} onChange={handleInputChange} />
                                                </div>
                                                <div className="form-group-premium">
                                                    <label className="text-xs font-bold text-slate-500 mb-3 block uppercase tracking-wide">Asset Value</label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-bold pointer-events-none z-20">₹</span>
                                                        <input type="text" disabled className="input-premium-modern w-full !bg-slate-50 !text-emerald-700 !border-dashed !pl-10 text-base font-black" value={computedStockValue === '0.00' ? '' : computedStockValue} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                                                <div className="form-group-premium">
                                                    <label className="text-xs font-bold text-slate-500 mb-2 block">Maximum</label>
                                                    <input type="text" inputMode="decimal" name="max_stock" placeholder="0" className="input-premium-modern w-full text-base font-semibold relative z-10" value={formData.max_stock} onChange={handleInputChange} />
                                                </div>
                                                <div className="form-group-premium">
                                                    <label className="text-xs font-bold text-slate-500 mb-2 block">Minimum</label>
                                                    <input type="text" inputMode="decimal" name="min_stock" placeholder="0" className="input-premium-modern w-full text-base font-semibold relative z-10" value={formData.min_stock} onChange={handleInputChange} />
                                                </div>
                                                <div className="form-group-premium">
                                                    <label className="text-xs font-bold text-slate-500 mb-2 block font-black text-rose-500">Alert Re-order</label>
                                                    <input type="text" inputMode="decimal" name="reorder_level" placeholder="0" className="input-premium-modern w-full text-base font-black bg-rose-50/20 text-rose-600 border-rose-100 relative z-10" value={formData.reorder_level} onChange={handleInputChange} />
                                                </div>
                                                <div className="form-group-premium">
                                                    <label className="text-xs font-bold text-slate-500 mb-2 block font-black text-rose-700">Crisis Alert</label>
                                                    <input type="text" inputMode="decimal" name="urgent_order_level" placeholder="0" className="input-premium-modern w-full text-base font-black bg-rose-100/30 text-rose-800 border-rose-200 relative z-10" value={formData.urgent_order_level} onChange={handleInputChange} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm col-span-1 lg:col-span-2">
                                            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                                                <div className="flex items-center gap-2">
                                                    <Layers className="text-indigo-600" size={20} />
                                                    <h4 className="text-lg font-bold text-slate-800">Variations (e.g. Small, Medium, Large)</h4>
                                                </div>
                                                <button type="button" onClick={handleAddVariation} className="btn-premium-outline !py-1 !px-3 !text-xs">
                                                    <Plus size={14} /> Add Variation
                                                </button>
                                            </div>
                                            {formData.variations?.length > 0 ? (
                                                <div className="space-y-3">
                                                    {formData.variations.map((v, idx) => (
                                                        <div key={idx} className="flex gap-6 items-end group/item">
                                                            <div className="form-group-premium flex-[2] !mb-0">
                                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Descriptor (e.g. XL-Size)</label>
                                                                <input type="text" placeholder="Variation Name" className="input-premium-modern w-full text-base font-bold" value={v.name} onChange={(e) => handleVariationChange(idx, 'name', e.target.value)} />
                                                            </div>
                                                            <div className="form-group-premium flex-1 !mb-0">
                                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Delta (₹)</label>
                                                                <input type="number" placeholder="+ Amt" className="input-premium-modern w-full text-base font-bold" value={v.amount} onChange={(e) => handleVariationChange(idx, 'amount', parseFloat(e.target.value) || 0)} />
                                                            </div>
                                                            <button type="button" onClick={() => handleRemoveVariation(idx)} className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover/item:opacity-100 shadow-sm">
                                                                <Trash2 size={20} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
                                                    No variations defined. Click 'Add Variation' for multiple sizes/types.
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm col-span-1 lg:col-span-2">
                                            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                                                <div className="flex items-center gap-2">
                                                    <Plus className="text-indigo-600" size={20} />
                                                    <h4 className="text-lg font-bold text-slate-800">Addons (Extras like Cheese)</h4>
                                                </div>
                                                <button type="button" onClick={handleAddAddon} className="btn-premium-outline !py-1 !px-3 !text-xs">
                                                    <Plus size={14} /> Add addon
                                                </button>
                                            </div>
                                            {formData.addons.length > 0 ? (
                                                <div className="space-y-3">
                                                    {formData.addons.map((addon, idx) => (
                                                        <div key={idx} className="flex gap-6 items-end group/item">
                                                            <div className="form-group-premium flex-[2] !mb-0">
                                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Addon Identity</label>
                                                                <input type="text" placeholder="e.g. Extra Dip" className="input-premium-modern w-full text-base font-bold" value={addon.name} onChange={(e) => handleAddonChange(idx, 'name', e.target.value)} />
                                                            </div>
                                                            <div className="form-group-premium flex-1 !mb-0">
                                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Rate (₹)</label>
                                                                <input type="number" placeholder="Rate" className="input-premium-modern w-full text-base font-bold" value={addon.rate} onChange={(e) => handleAddonChange(idx, 'rate', parseFloat(e.target.value) || 0)} />
                                                            </div>
                                                            <button type="button" onClick={() => handleRemoveAddon(idx)} className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover/item:opacity-100 shadow-sm">
                                                                <Trash2 size={20} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
                                                    No addons configured. Click 'Add addon' to create.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-8">
                                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                                            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                                                <Clock className="text-indigo-600" size={20} />
                                                <h4 className="text-lg font-bold text-slate-800">Temporal Availability</h4>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
                                                {formData.available_timings.map((t, i) => (
                                                    <div key={i} className={`p-6 rounded-3xl border transition-all flex flex-col justify-between ${t.enabled ? 'border-indigo-100 bg-white shadow-xl shadow-slate-100' : 'border-slate-100 bg-slate-50/50 grayscale opacity-60'}`}>
                                                        <div className="flex justify-between items-center mb-6">
                                                            <div>
                                                                <span className={`text-xs font-bold uppercase tracking-wider ${t.enabled ? 'text-indigo-600' : 'text-slate-400'}`}>{t.label} Window</span>
                                                            </div>
                                                            <button type="button" onClick={() => {
                                                                const nt = [...formData.available_timings];
                                                                nt[i].enabled = !nt[i].enabled;
                                                                setFormData(p => ({ ...p, available_timings: nt }));
                                                            }} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${t.enabled ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-slate-200 text-slate-500'}`}>
                                                                {t.enabled ? <Check size={22} /> : <XCircle size={22} />}
                                                            </button>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-6">
                                                            <div>
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-widest">Activation</span>
                                                                <input type="time" className="w-full bg-slate-50 border-none px-4 py-3 rounded-2xl text-base font-black text-slate-700 focus:bg-white transition-colors" value={t.start_time} onChange={(e) => {
                                                                    const nt = [...formData.available_timings];
                                                                    nt[i].start_time = e.target.value;
                                                                    setFormData(p => ({ ...p, available_timings: nt }));
                                                                }} />
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-widest">Termination</span>
                                                                <input type="time" className="w-full bg-slate-50 border-none px-4 py-3 rounded-2xl text-base font-black text-slate-700 focus:bg-white transition-colors" value={t.end_time} onChange={(e) => {
                                                                    const nt = [...formData.available_timings];
                                                                    nt[i].end_time = e.target.value;
                                                                    setFormData(p => ({ ...p, available_timings: nt }));
                                                                }} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                    </div>
                                </form>
                            </div>
                            <div className="drawer-footer">
                                <button onClick={() => setShowDrawer(false)} className="btn-premium-outline">Cancel</button>
                                <button type="submit" form="product-form" disabled={submitting || uploading} className="btn-premium-primary">
                                    {submitting ? <Loader2 className="animate-spin" /> : (isEditing ? 'Save Changes' : 'Create Item')}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default ProductMaster;
