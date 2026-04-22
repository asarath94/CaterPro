import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Loader2, Building2, User, MapPin, Phone, Mail,
  Camera, CheckCircle, AlertCircle, Upload, Plus, Trash2, Pencil, X, Check
} from 'lucide-react';

// Reusable multi-entry list editor (phones or emails)
const MultiEntryField = ({ icon: Icon, label, placeholder, type = 'text', items, onChange }) => {
  const [inputVal, setInputVal] = useState('');
  const [editingIdx, setEditingIdx] = useState(null);
  const [editVal, setEditVal] = useState('');

  const handleAdd = () => {
    const trimmed = inputVal.trim();
    if (!trimmed) return;
    onChange([...items, trimmed]);
    setInputVal('');
  };

  const handleDelete = (idx) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const startEdit = (idx) => {
    setEditingIdx(idx);
    setEditVal(items[idx]);
  };

  const confirmEdit = (idx) => {
    const trimmed = editVal.trim();
    if (!trimmed) return;
    const updated = [...items];
    updated[idx] = trimmed;
    onChange(updated);
    setEditingIdx(null);
  };

  const cancelEdit = () => setEditingIdx(null);

  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" /> {label}
      </label>

      {/* Existing items */}
      {items.length > 0 && (
        <div className="space-y-2 mb-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              {editingIdx === idx ? (
                <>
                  <input
                    autoFocus
                    type={type}
                    value={editVal}
                    onChange={e => setEditVal(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') confirmEdit(idx); if (e.key === 'Escape') cancelEdit(); }}
                    className="flex-1 bg-transparent outline-none text-slate-900 font-medium text-sm"
                  />
                  <button type="button" onClick={() => confirmEdit(idx)} className="text-green-600 hover:text-green-800 p-1">
                    <Check className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={cancelEdit} className="text-slate-400 hover:text-slate-600 p-1">
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-slate-800 font-medium text-sm">{item}</span>
                  <button type="button" onClick={() => startEdit(idx)} className="text-slate-400 hover:text-blue-600 p-1 transition">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => handleDelete(idx)} className="text-slate-400 hover:text-red-600 p-1 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add new entry */}
      <div className="flex gap-2">
        <input
          type={type}
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
          placeholder={placeholder}
          className="flex-1 p-2.5 bg-slate-50 border border-dashed border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-700 placeholder:text-slate-400"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!inputVal.trim()}
          className="px-3 py-2.5 bg-slate-900 hover:bg-slate-700 text-white rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
const Profile = () => {
  const { token } = useAuth();

  const [profile, setProfile] = useState({
    businessName: '',
    proprietorName: '',
    address: '',
    email: '',
    phones: [],
    contactEmails: [],
    businessLogo: '',
  });

  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load profile');
        const data = await res.json();
        setProfile({
          businessName: data.businessName || '',
          proprietorName: data.proprietorName || '',
          address: data.address || '',
          email: data.email || '',
          phones: data.phones || [],
          contactEmails: data.contactEmails || [],
          businessLogo: data.businessLogo || '',
        });
        if (data.businessLogo) setLogoPreview(data.businessLogo);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleChange = (e) => {
    setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('businessName', profile.businessName);
      formData.append('proprietorName', profile.proprietorName);
      formData.append('address', profile.address);
      formData.append('email', profile.email);
      // Arrays must be JSON-stringified for FormData transport
      formData.append('phones', JSON.stringify(profile.phones));
      formData.append('contactEmails', JSON.stringify(profile.contactEmails));
      if (logoFile) formData.append('businessLogo', logoFile);

      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to save profile');
      }

      const updated = await res.json();
      setProfile({
        businessName: updated.businessName || '',
        proprietorName: updated.proprietorName || '',
        address: updated.address || '',
        email: updated.email || '',
        phones: updated.phones || [],
        contactEmails: updated.contactEmails || [],
        businessLogo: updated.businessLogo || '',
      });
      if (updated.businessLogo) setLogoPreview(updated.businessLogo);
      setLogoFile(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto overflow-y-auto h-full pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Business Profile</h1>
        <p className="text-slate-500 font-medium mt-1">Manage your catering business identity and contact details.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Logo Upload Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 text-center sm:text-left">Business Logo</h2>
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 text-center sm:text-left">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group flex-shrink-0"
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Business Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <div className="text-center">
                  <Camera className="w-8 h-8 text-slate-400 group-hover:text-blue-500 mx-auto transition" />
                  <p className="text-xs text-slate-400 mt-1">Upload</p>
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold text-slate-800 mb-1">Upload Your Logo</p>
              <p className="text-sm text-slate-500 mb-4">PNG, JPG or WEBP. Max 5 MB. Stored on Cloudinary.</p>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition">
                <Upload className="w-4 h-4" />
                {logoPreview ? 'Change Logo' : 'Choose File'}
              </button>
              {logoFile && <p className="text-xs text-blue-600 font-medium mt-2">✓ {logoFile.name} selected</p>}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
        </div>

        {/* Business Details Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Business Details</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Business Name
              </label>
              <input
                type="text" name="businessName" value={profile.businessName} onChange={handleChange}
                placeholder="e.g. Royal Feast Caterers"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 text-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Proprietor / Owner Name
              </label>
              <input
                type="text" name="proprietorName" value={profile.proprietorName} onChange={handleChange}
                placeholder="e.g. Ravi Kumar"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Business Address
              </label>
              <textarea
                name="address" value={profile.address} onChange={handleChange} rows={3}
                placeholder="e.g. 45, M.G. Road, Bangalore - 560001"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Contact Details Card — Dynamic Multi-Entry */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Contact Information</h2>
          <div className="space-y-7">

            <MultiEntryField
              icon={Phone}
              label="Mobile Numbers"
              placeholder="Add a phone number and press Enter or +"
              type="tel"
              items={profile.phones}
              onChange={(updated) => setProfile(prev => ({ ...prev, phones: updated }))}
            />

            <div className="border-t border-slate-100 pt-7">
              <MultiEntryField
                icon={Mail}
                label="Contact Email IDs"
                placeholder="Add an email address and press Enter or +"
                type="email"
                items={profile.contactEmails}
                onChange={(updated) => setProfile(prev => ({ ...prev, contactEmails: updated }))}
              />
            </div>

            <div className="border-t border-slate-100 pt-6">
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-500" /> Login / Admin Email
              </label>
              <input
                type="email" name="email" value={profile.email} onChange={handleChange}
                placeholder="Admin login email"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-400 font-medium text-slate-800"
              />
              <p className="text-xs text-slate-400 mt-1.5">This is the email used to log in to the dashboard.</p>
            </div>

          </div>
        </div>

        {/* Feedback */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-bold">Profile saved successfully!</p>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-2xl transition shadow-lg shadow-blue-900/20 flex items-center justify-center gap-3 disabled:opacity-70"
        >
          {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</> : 'Save Profile'}
        </button>

      </form>
    </div>
  );
};

export default Profile;
