import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Loader2, AlertCircle, Plus, Trash2, Edit2, ListChecks } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MenuSettings = () => {
  const { token } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [subCats, setSubCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [catName, setCatName] = useState('');
  
  const [formData, setFormData] = useState({
    category: 'Veg',
    subCategory: '',
    itemName: ''
  });

  const fetchDependencies = async () => {
    try {
      const [mRes, cRes] = await Promise.all([
        fetch('/api/menu', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/menu/categories', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (!mRes.ok || !cRes.ok) throw new Error('Failed to fetch master data');
      
      const mData = await mRes.ok ? await mRes.json() : [];
      const cData = await cRes.ok ? await cRes.json() : [];
      
      setMenuItems(mData);
      setSubCats(cData);
      
      // Preset form
      if (cData.length > 0) {
         setFormData(prev => ({ ...prev, subCategory: prev.subCategory || cData[0].name }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ category: 'Veg', subCategory: subCats.length > 0 ? subCats[0].name : '', itemName: '' });
  };

  const handleEditClick = (item) => {
    setEditingId(item._id);
    setFormData({
      category: item.category,
      subCategory: item.subCategory,
      itemName: item.itemName
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('WARNING: Deleting this item removes it permanently. Proceed?')) return;
    
    try {
      const res = await fetch(`/api/menu/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete item.');
      
      setMenuItems(menuItems.filter(item => item._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddCat = async (e) => {
     e.preventDefault();
     setIsSubmittingCat(true);
     try {
        const res = await fetch('/api/menu/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ name: catName })
        });
        if (!res.ok) {
           const err = await res.json();
           throw new Error(err.message || 'Failed to add category');
        }
        await fetchDependencies();
        setCatName('');
     } catch(err) {
        alert(err.message);
     } finally {
        setIsSubmittingCat(false);
     }
  };

  const handleDelCat = async (id) => {
    if (!window.confirm('Deleting this Master Category removes it from the Dropdown permanently (Items using it will not be deleted but may be orphaned). Proceed?')) return;
    try {
      const res = await fetch(`/api/menu/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed.');
      await fetchDependencies();
    } catch(e) { alert(e.message); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subCategory) return alert('You must create and select a Sub-Category first!');
    
    setIsSubmittingItem(true);
    
    const url = editingId ? `/api/menu/${editingId}` : '/api/menu';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error('Failed to save menu item.');
      await fetchDependencies();
      resetForm();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmittingItem(false);
    }
  };

  // Grouper logic for UI
  const vegItems = menuItems.filter(m => m.category === 'Veg');
  const nonVegItems = menuItems.filter(m => m.category === 'Non-Veg');

  const MenuTable = ({ items, themeClass }) => (
    <div className="w-full overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm">
      {items.length === 0 ? (
        <p className="p-6 text-slate-500 italic">No items created for this category yet.</p>
      ) : (
        <table className="w-full text-left text-sm text-slate-600">
          <thead className={`text-xs uppercase bg-slate-50 ${themeClass}`}>
            <tr>
              <th className="px-6 py-4 font-bold">Sub-Category</th>
              <th className="px-6 py-4 font-bold">Item Name</th>
              <th className="px-6 py-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-semibold text-slate-900">{item.subCategory}</td>
                <td className="px-6 py-4">{item.itemName}</td>
                <td className="px-6 py-4 flex justify-end gap-3">
                  <button onClick={() => handleEditClick(item)} className="text-blue-600 hover:text-blue-800 transition p-1 hover:bg-blue-50 rounded" title="Edit">
                     <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(item._id)} className="text-red-500 hover:text-red-700 transition p-1 hover:bg-red-50 rounded" title="Delete">
                     <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;

  return (
    <div className="p-8 max-w-6xl mx-auto h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Master Menu Settings</h1>
        <p className="text-slate-500 font-medium tracking-wide">Globally control the catering options available for Event Orders.</p>
      </div>

      {error ? (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8 pb-12">
          
          {/* Create / Edit Form Sidebar */}
          <div className="w-full lg:w-1/3">
             <div className="sticky top-8 space-y-8">
               <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                 <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                   <ListChecks className="w-5 h-5 text-blue-600"/>
                   {editingId ? 'Edit Menu Item' : 'Add New Item'}
                 </h2>
                 <form onSubmit={handleSubmit} className="space-y-4">
                   <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Category</label>
                     <select 
                       name="category" 
                       value={formData.category} 
                       onChange={handleInputChange} 
                       className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                     >
                       <option value="Veg">Vegetarian (Veg)</option>
                       <option value="Non-Veg">Non-Vegetarian (Non-Veg)</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Sub-Category</label>
                     <select 
                       required
                       name="subCategory"
                       value={formData.subCategory} 
                       onChange={handleInputChange} 
                       className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                     >
                       {subCats.length === 0 && <option value="">Please add a Sub-Category first...</option>}
                       {subCats.map(sc => (
                         <option key={sc._id} value={sc.name}>{sc.name}</option>
                       ))}
                     </select>
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Item Name</label>
                     <input 
                       required type="text" 
                       name="itemName"
                       placeholder="e.g. Paneer Tikka"
                       value={formData.itemName} 
                       onChange={handleInputChange} 
                       className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
                     />
                   </div>
                   
                   <div className="pt-4 flex gap-3">
                     {editingId && (
                       <button type="button" onClick={resetForm} className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition text-sm w-full">Cancel</button>
                     )}
                     <button type="submit" disabled={isSubmittingItem || subCats.length === 0} className="px-4 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm w-full disabled:opacity-75 disabled:cursor-not-allowed">
                       {isSubmittingItem ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? 'Save Edits' : <><Plus className="w-4 h-4" /> Add Item</>)}
                     </button>
                   </div>
                 </form>
               </div>

               <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                 <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                   Define Sub-Category
                 </h2>
                 <form onSubmit={handleAddCat} className="flex gap-2">
                   <input 
                     required type="text"
                     value={catName}
                     onChange={e => setCatName(e.target.value)}
                     placeholder="e.g. Desserts"
                     className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm"
                   />
                   <button type="submit" disabled={isSubmittingCat || !catName} className="p-2 bg-slate-900 text-white rounded-lg disabled:opacity-50">
                      {isSubmittingCat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-5 h-5" />}
                   </button>
                 </form>

                 {subCats.length > 0 && (
                   <div className="mt-4 max-h-40 overflow-y-auto space-y-1">
                      {subCats.map(sc => (
                        <div key={sc._id} className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded border border-slate-100">
                           <span className="font-medium text-slate-700">{sc.name}</span>
                           <button onClick={() => handleDelCat(sc._id)} className="text-red-500 hover:text-red-700">
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                      ))}
                   </div>
                 )}
               </div>
             </div>
          </div>

          {/* Render Groups */}
          <div className="w-full lg:w-2/3 space-y-8">
            <div>
               <h3 className="text-xl font-black text-green-700 flex items-center gap-2 mb-4">
                 <div className="w-3 h-3 rounded-full bg-green-500"></div> Vegetarian Menu
               </h3>
               <MenuTable items={vegItems} themeClass="text-green-700 placeholder:text-green-500" />
            </div>

            <div>
               <h3 className="text-xl font-black text-rose-700 flex items-center gap-2 mb-4">
                 <div className="w-3 h-3 rounded-full bg-rose-500"></div> Non-Vegetarian Menu
               </h3>
               <MenuTable items={nonVegItems} themeClass="text-rose-700" />
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default MenuSettings;
