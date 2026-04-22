import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Camera, Upload, X, Loader2, AlertCircle } from 'lucide-react';

const CreateCustomer = () => {
  const location = useLocation();
  const editCustomer = location.state?.editCustomer;
  const isEditMode = !!editCustomer;

  const [formData, setFormData] = useState({ 
    name: editCustomer?.name || '', 
    phone: editCustomer?.phone || '', 
    email: editCustomer?.email || '', 
    location: editCustomer?.location || '' 
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(editCustomer?.photoURL || null);
  
  const [useCamera, setUseCamera] = useState(false);
  const [stream, setStream] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (useCamera && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [useCamera, stream]);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Camera Logic
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(mediaStream);
      setUseCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Camera access denied or unavailable.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setUseCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      // Set canvas size matching video
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      
      canvasRef.current.toBlob((blob) => {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        setImageFile(file);
        setPreviewURL(URL.createObjectURL(blob));
        stopCamera();
      }, 'image/jpeg', 0.8);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewURL(URL.createObjectURL(file));
      stopCamera();
    }
  };

  const removePhoto = () => {
    setImageFile(null);
    setPreviewURL(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('phone', formData.phone);
      data.append('email', formData.email);
      data.append('location', formData.location);
      if (imageFile) {
        data.append('photo', imageFile);
      }

      const url = isEditMode ? `/api/customers/${editCustomer._id}` : '/api/customers';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Authorization': `Bearer ${token}` }, // Do not set content-type, browser does it for FormData
        body: data
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to create customer');
      }

      navigate('/customers');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">{isEditMode ? 'Edit Customer' : 'Create Customer'}</h1>
        <p className="text-slate-500 font-medium">{isEditMode ? 'Modify client details safely.' : 'Add a new client to the database.'}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        
        {/* Photo Section */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-slate-700 mb-4">Customer Photo</label>
          
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Preview or Video */}
            <div className="relative w-40 h-40 bg-slate-100 rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 flex items-center justify-center flex-shrink-0">
              {useCamera ? (
                <>
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <canvas ref={canvasRef} className="hidden" />
                </>
              ) : previewURL ? (
                <>
                  <img src={previewURL} alt="Preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={removePhoto} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="text-slate-400 text-center flex flex-col items-center">
                  <Camera className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-xs font-medium uppercase tracking-wider">No Photo</span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-3">
              {useCamera ? (
                <div className="flex gap-2">
                   <button type="button" onClick={capturePhoto} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition">Snap Photo</button>
                   <button type="button" onClick={stopCamera} className="px-4 py-2 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 transition">Cancel</button>
                </div>
              ) : (
                <>
                  <button type="button" onClick={startCamera} className="w-full px-5 py-2.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition flex items-center gap-2">
                    <Camera className="w-4 h-4" /> Take Picture
                  </button>
                  <div className="relative">
                    <input type="file" accept="image/*" onChange={handleFileSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <button type="button" className="w-full px-5 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition flex items-center gap-2 border border-slate-200">
                      <Upload className="w-4 h-4" /> Upload File
                    </button>
                  </div>
                </>
              )}
              <p className="text-xs text-slate-500 mt-2 max-w-[200px]">We use Cloudinary optimization. Any large images will be automatically compressed securely.</p>
            </div>
          </div>
        </div>

        {/* Text Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name *</label>
            <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Jane Doe" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number *</label>
            <input required type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="+1 (555) 000-0000" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
            <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="jane@example.com" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Primary Location</label>
            <input type="text" name="location" value={formData.location} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="City, State" />
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end gap-3">
          {isEditMode && (
             <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition min-w-[100px]">
               Cancel
             </button>
          )}
          <button type="submit" disabled={loading} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-500/30 flex items-center justify-center min-w-[150px] disabled:opacity-75">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEditMode ? 'Update Details' : 'Save Customer')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCustomer;
