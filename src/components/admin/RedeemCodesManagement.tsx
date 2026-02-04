import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { FaToggleOn, FaToggleOff, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { apiService } from '../../services/api';

interface RedeemCode {
  id: number;
  code: string;
  coins: number;
  status: 'active' | 'used' | 'expired';
  expires_at: string | null;
  used_by: number | null;
  used_by_username: string | null;
  used_at: string | null;
  created_at: string;
  is_valid: boolean;
}

const RedeemCodesManagement = forwardRef((_props, ref) => {
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [codeToDelete, setCodeToDelete] = useState<RedeemCode | null>(null);
  const [formData, setFormData] = useState({ code: '', coins: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadCodes();
  }, []);

  const loadCodes = async () => {
    try {
      setLoading(true);
      const response = await apiService.getRedeemCodes();
      setCodes(response.results);
    } catch (error) {
      console.error('Failed to load codes:', error);
      alert('Failed to load redeem codes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Expose openModal method to parent component
  useImperativeHandle(ref, () => ({
    openModal: () => setShowForm(true)
  }));

  const toggleRowExpansion = (codeId: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(codeId)) {
      newExpandedRows.delete(codeId);
    } else {
      newExpandedRows.add(codeId);
    }
    setExpandedRows(newExpandedRows);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newCode = {
        code: formData.code.toUpperCase(),
        coins: parseInt(formData.coins)
      };

      await apiService.createRedeemCode(newCode);

      setFormData({ code: '', coins: '' });
      setShowForm(false);
      await loadCodes(); // Refresh data
    } catch (error) {
      console.error('Failed to create code:', error);
      alert('Failed to create redeem code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (code: RedeemCode) => {
    setCodeToDelete(code);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!codeToDelete) return;

    setIsDeleting(true);
    try {
      await apiService.deleteRedeemCode(codeToDelete.id);
      setShowDeleteModal(false);
      setCodeToDelete(null);
      await loadCodes(); // Refresh data
    } catch (error) {
      console.error('Failed to delete code:', error);
      alert('Failed to delete redeem code. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setCodeToDelete(null);
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      // Clear the copied state after 2 seconds
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
        alert('Failed to copy code to clipboard');
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div>
      <div className="mb-2">
        <p className="text-xs text-gray-500">💡 Click on any code to copy it to clipboard</p>
      </div>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <table className="w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
              <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="hidden md:table-cell px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="hidden md:table-cell px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Used By</th>
              <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          {loading ? (
            <tbody>
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
                    Loading redeem codes...
                  </div>
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody className="bg-white divide-y divide-gray-200">
              {codes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No redeem codes found. Click "Add Code" to create your first code.
                  </td>
                </tr>
              ) : (
                codes.map((code) => (
                  <React.Fragment key={code.id}>
                    <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleRowExpansion(code.id)}>
                      <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-sm md:text-base font-mono text-gray-900 bg-gray-50">
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            copyCode(code.code);
                          }}
                          className={`cursor-pointer select-none transition-colors hover:text-blue-600 ${
                            copiedCode === code.code ? 'text-green-600' : ''
                          }`}
                          title="Click to copy code"
                        >
                          {code.code}
                          {copiedCode === code.code && (
                            <svg className="inline h-3 w-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                      </td>
                      <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">{code.coins} coins</td>
                      <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap">
                        <span className={`px-1 md:px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          code.status === 'active' ? 'bg-green-100 text-green-800' :
                          code.status === 'used' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {code.status}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                        {new Date(code.created_at).toLocaleDateString()}
                      </td>
                      <td className="hidden md:table-cell px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                        {code.used_by_username || 'Not used'}
                      </td>
                      <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm font-medium flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(code);
                          }}
                          className="px-2 md:px-3 py-1 rounded transition-colors text-xs md:text-sm text-white bg-red hover:bg-red-700"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => toggleRowExpansion(code.id)}
                          className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                        >
                          {expandedRows.has(code.id) ? <FaChevronDown /> : <FaChevronRight />}
                        </button>
                      </td>
                    </tr>
                    {expandedRows.has(code.id) && (
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="px-4 md:px-12 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="md:hidden">
                              <span className="font-medium text-gray-700">Created:</span>
                              <span className="ml-2 text-gray-900">{new Date(code.created_at).toLocaleDateString()}</span>
                              <span className="font-medium text-gray-700 block mt-3">Used By:</span>
                              <span className="ml-2 text-gray-900">{code.used_by_username || 'Not used'}</span>
                            </div>
                            <div className="md:hidden">
                              <span className="font-medium text-gray-700">Full Details:</span>
                              <div className="mt-2 space-y-1">
                                <div className="font-medium text-gray-700">ID: {code.id}</div>
                                <div className="font-medium text-gray-700">Code: {code.code}</div>
                                <div className="font-medium text-gray-700">Coins: {code.coins}</div>
                                <div className="font-medium text-gray-700">Status: {code.status}</div>
                                <div className="font-medium text-gray-700">Valid: {code.is_valid ? 'Yes' : 'No'}</div>
                                {code.used_at && <div className="font-medium text-gray-700">Used At: {new Date(code.used_at).toLocaleString()}</div>}
                              </div>
                            </div>
                            <div className="hidden md:block">
                              <span className="font-medium text-gray-700">Additional Information:</span>
                              <div className="mt-2 space-y-1">
                                <div>Code ID: {code.id}</div>
                                <div>Current Status: {code.status}</div>
                                <div>Is Valid: {code.is_valid ? 'Yes' : 'No'}</div>
                                {code.expires_at && <div>Expires: {new Date(code.expires_at).toLocaleDateString()}</div>}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          )}
        </table>
        </div>
      </div>

      {/* Add Code Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Add Redeem Code</h3>
            <p className="text-sm text-gray-600 mb-4">Create a new redeem code for users</p>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Code:</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="e.g. WELCOME100"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Coins:</label>
                <input
                  type="number"
                  value={formData.coins}
                  onChange={(e) => setFormData({...formData, coins: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 100"
                  min="1"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({ code: '', coins: '' });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && codeToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full">
            <div className="text-center">
              {/* Warning Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 bg-red">
                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold mb-2 text-red">Delete Redeem Code</h3>

              {/* Message */}
              <p className="text-gray-600 mb-6 text-center">
                Are you sure you want to delete the redeem code <strong className="font-mono text-gray-900">{codeToDelete.code}</strong>?
                This action cannot be undone.
              </p>

              {/* Code Details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Code:</span>
                    <div className="font-mono text-gray-900">{codeToDelete.code}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Coins:</span>
                    <div className="text-gray-900">{codeToDelete.coins}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <div className="text-gray-900">{codeToDelete.status}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Used:</span>
                    <div className="text-gray-900">{codeToDelete.used_by_username || 'No'}</div>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete Code'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

RedeemCodesManagement.displayName = 'RedeemCodesManagement';

export default RedeemCodesManagement;
