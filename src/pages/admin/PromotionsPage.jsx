import { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { ToastContainer } from '../../components/admin/shared/Toast';
import { usersApi, promotionsApi } from '../../services/apiService';

const STYLE = `
  .promotions-page { font-family: 'Inter', sans-serif; background: rgb(248 250 252); min-height: 100vh; padding: 24px; }
  .promotions-card { background: white; border: 1px solid rgb(226 232 240); border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1); max-width: 800px; margin: 0 auto; }
  .promotions-field { width: 100%; padding: 10px 14px; border: 1px solid rgb(226 232 240); border-radius: 8px; font-size: 0.875rem; color: rgb(15 23 42); transition: all 0.2s; background: white; }
  .promotions-field:focus { outline: none; border-color: rgb(79 70 229); box-shadow: 0 0 0 3px rgb(79 70 229 / 0.1); }
  .promotions-label { display: block; font-size: 0.875rem; font-weight: 600; color: rgb(71 85 105); margin-bottom: 8px; }
  .promotions-btn-primary { background: rgb(79 70 229); color: white; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 1rem; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: none; cursor: pointer; width: 100%; }
  .promotions-btn-primary:hover { background: rgb(67 56 202); }
  .promotions-btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
  .checkbox-group { display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto; padding: 12px; border: 1px solid rgb(226 232 240); border-radius: 8px; }
  .checkbox-item { display: flex; align-items: center; gap: 8px; font-size: 0.875rem; color: rgb(15 23 42); }
  .ql-container { font-family: 'Inter', sans-serif; font-size: 1rem; min-height: 200px; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; }
  .ql-toolbar { border-top-left-radius: 8px; border-top-right-radius: 8px; border-color: rgb(226 232 240); }
`;

const PromotionsPage = () => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [sendToAll, setSendToAll] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(true);
  const [toasts, setToasts] = useState([]);

  const showToast = (msg, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message: msg, type, duration: 3000 }]);
  };

  const dismissToast = (id) => setToasts(t => t.filter(x => x.id !== id));

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await usersApi.getAll();
        // Filter out users without email (if any)
        setUsers(usersData.filter(u => u.email));
      } catch (error) {
        console.error('Failed to fetch users:', error);
        showToast('Failed to load users list.', 'error');
      } finally {
        setFetchingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  const handleUserToggle = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      showToast('Subject and Message are required.', 'error');
      return;
    }
    
    if (!sendToAll && selectedUsers.length === 0) {
      showToast('Please select at least one user to send to.', 'error');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('subject', subject);
      formData.append('message', message);
      formData.append('isAllUsers', sendToAll);

      if (!sendToAll) {
        selectedUsers.forEach(id => {
          formData.append('userIds', id);
        });
      }

      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (promotionsApi && promotionsApi.send) {
        await promotionsApi.send(formData);
        showToast('Promotion sent successfully!', 'success');
      } else {
        showToast('Promotions service endpoint not available.', 'error');
      }
      
      // Reset form
      setSubject('');
      setMessage('');
      setImageFile(null);
      setSelectedUsers([]);
      setSendToAll(true);
    } catch (error) {
      console.error('Failed to send promotion:', error);
      showToast('Failed to send promotion. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{STYLE}</style>
      <div className="promotions-page">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Promotions & Offers</h1>
            <p className="text-slate-500 mt-1">Send marketing emails and offers to your customers</p>
          </div>
        </div>

        <div className="promotions-card">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <label className="promotions-label">Subject</label>
              <input 
                type="text" 
                className="promotions-field" 
                placeholder="e.g., Weekend Special: 20% off all Chai!"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label className="promotions-label">Message (Offer Details)</label>
              <ReactQuill 
                theme="snow"
                value={message}
                onChange={setMessage}
                readOnly={loading}
                placeholder="Write your beautiful promotional message here..."
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link', 'clean']
                  ],
                }}
              />
            </div>

            <div>
              <label className="promotions-label">Promotional Image (Optional)</label>
              <input 
                type="file" 
                accept="image/*"
                className="promotions-field"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setImageFile(e.target.files[0]);
                  }
                }}
                disabled={loading}
              />
              <p className="text-xs text-slate-500 mt-2">This image will be attached directly into the email body.</p>
            </div>

            <div>
              <label className="promotions-label mb-2">Audience</label>
              <div className="flex items-center gap-2 mb-4">
                <input 
                  type="checkbox" 
                  id="sendToAll" 
                  checked={sendToAll} 
                  onChange={(e) => {
                    setSendToAll(e.target.checked);
                    if (e.target.checked) setSelectedUsers([]);
                  }}
                  disabled={loading || fetchingUsers}
                />
                <label htmlFor="sendToAll" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Send to all registered users ({users.length})
                </label>
              </div>

              {!sendToAll && (
                <div className="checkbox-group">
                  {fetchingUsers ? (
                    <div className="text-sm text-slate-500">Loading users...</div>
                  ) : users.length === 0 ? (
                    <div className="text-sm text-slate-500">No users found with email addresses.</div>
                  ) : (
                    users.map(user => (
                      <label key={user.id} className="checkbox-item">
                        <input 
                          type="checkbox" 
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleUserToggle(user.id)}
                          disabled={loading}
                        />
                        <span className="font-medium">{user.name || 'Unknown'}</span>
                        <span className="text-slate-500 ml-1">({user.email})</span>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>

            <button 
              type="submit" 
              className="promotions-btn-primary mt-4"
              disabled={loading || fetchingUsers || (!sendToAll && selectedUsers.length === 0) || !subject || !message}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending Promotion...
                </>
              ) : (
                <>
                  <span>Send Promotion 🚀</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
};

export default PromotionsPage;
