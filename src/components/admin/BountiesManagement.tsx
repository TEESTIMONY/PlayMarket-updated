import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { FaEdit, FaTrash, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { apiService, type Bounty, type BountyClaim } from '../../services/api';

const BountiesManagement = forwardRef(({ onActionButtonVisibilityChange }: { onActionButtonVisibilityChange?: (visible: boolean) => void }, ref) => {
  const [activeTab, setActiveTab] = useState<'create' | 'results'>('create');
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [claims, setClaims] = useState<BountyClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [deletingBounty, setDeletingBounty] = useState(false);
  const [creatingBounty, setCreatingBounty] = useState(false);
  const [approvingClaim, setApprovingClaim] = useState(false);
  const [bountyToDelete, setBountyToDelete] = useState<number | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<BountyClaim | null>(null);
  const [editingBounty, setEditingBounty] = useState<Bounty | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reward: '',
    max_claims: '',
    expires_at: ''
  });
  const [refreshing, setRefreshing] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const [bountiesResponse, claimsResponse] = await Promise.all([
        apiService.getBounties(),
        apiService.getAllClaims()
      ]);
      setBounties(bountiesResponse.results);
      setClaims(claimsResponse.results);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Expose openModal method to parent component
  useImperativeHandle(ref, () => ({
    openModal: () => setShowForm(true)
  }));

  const handleTabChange = (tab: 'create' | 'results') => {
    setActiveTab(tab);
    if (onActionButtonVisibilityChange) {
      onActionButtonVisibilityChange(tab === 'create');
    }
  };

  const toggleRowExpansion = (bountyId: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(bountyId)) {
      newExpandedRows.delete(bountyId);
    } else {
      newExpandedRows.add(bountyId);
    }
    setExpandedRows(newExpandedRows);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingBounty(true);

    try {
      const bountyData = {
        title: formData.title,
        description: formData.description,
        reward: parseInt(formData.reward),
        max_claims: parseInt(formData.max_claims),
        expires_at: formData.expires_at || null
      };

      if (editingBounty) {
        await apiService.updateBounty(editingBounty.id, bountyData);
      } else {
        await apiService.createBounty(bountyData);
      }

      setShowForm(false);
      setEditingBounty(null);
      setFormData({ title: '', description: '', reward: '', max_claims: '', expires_at: '' });
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Failed to save bounty:', error);
      alert('Failed to save bounty. Please try again.');
    } finally {
      setCreatingBounty(false);
    }
  };

  const handleEdit = (bounty: Bounty) => {
    setEditingBounty(bounty);
    setFormData({
      title: bounty.title,
      description: bounty.description,
      reward: bounty.reward.toString(),
      max_claims: bounty.max_claims.toString(),
      expires_at: bounty.expires_at || ''
    });
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    setBountyToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!bountyToDelete) return;

    setShowDeleteModal(false);
    setDeletingBounty(true);

    try {
      await apiService.deleteBounty(bountyToDelete);
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Failed to delete bounty:', error);
      alert('Failed to delete bounty. Please try again.');
    } finally {
      setDeletingBounty(false);
      setBountyToDelete(null);
    }
  };

  const approveClaim = async () => {
    if (!selectedClaim) return;

    setApprovingClaim(true);

    try {
      await apiService.approveBountyClaim(selectedClaim.id);

      // Update the claim status locally and refresh data
      setSelectedClaim({...selectedClaim, status: 'approved', approved_at: new Date().toISOString()});
      await loadData(); // Refresh data
      
      // Refresh the user's balance to reflect the coin addition
      try {
        // Try to refresh balance - this will work if the user is the same as the claimant
        await apiService.getUserBalance();
      } catch (balanceError) {
        console.warn('Could not refresh user balance:', balanceError);
      }
      
      // Log the approval with user and reward information
    } catch (error) {
      console.error('Failed to approve claim:', error);
      alert('Failed to approve claim. Please try again.');
    } finally {
      setApprovingClaim(false);
    }
  };

  return (
    <div>
      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => handleTabChange('create')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'create'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Create
          </button>
          <button
            onClick={() => handleTabChange('results')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'results'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Results
          </button>
        </div>
      </div>

      {/* Create Tab Header with Refresh Button */}
      {activeTab === 'create' && (
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Bounty Management</h2>
            <p className="text-sm text-gray-600">Manage bounties and view all claims</p>
          </div>
          <button
            onClick={() => {
              setRefreshing(true);
              loadData(true).finally(() => setRefreshing(false));
            }}
            disabled={refreshing || loading}
            className={`px-4 py-2 rounded-md transition-colors ${
              refreshing || loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {refreshing ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Refreshing...</span>
              </div>
            ) : (
              'Refresh Data'
            )}
          </button>
        </div>
      )}

      {activeTab === 'create' ? (
        <>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="hidden md:table-cell px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reward</th>
              <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="hidden md:table-cell px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
              <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bounties.length > 0 ? (
              bounties.map((bounty) => (
                <React.Fragment key={bounty.id}>
                  <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleRowExpansion(bounty.id)}>
                    <td className="px-2 md:px-6 py-2 md:py-4 text-xs md:text-sm text-gray-900 max-w-32 md:max-w-none truncate md:whitespace-nowrap" title={bounty.title}>{bounty.title}</td>
                    <td className="hidden md:table-cell px-2 md:px-6 py-2 md:py-4 text-xs md:text-sm text-gray-900 max-w-xs truncate">{bounty.description}</td>
                    <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">{bounty.reward} coins</td>
                    <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap">
                      <span className={`px-1 md:px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        bounty.status === 'available' ? 'bg-green text-green-800' :
                        bounty.status === 'full' ? 'bg-yellow text-yellow-800' : 'bg-red text-red-800'
                      }`}>
                        {bounty.status}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                      {bounty.expires_at ? new Date(bounty.expires_at).toLocaleDateString() : 'No expiry'}
                    </td>
                    <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm font-medium">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(bounty);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Edit"
                        >
                          <FaEdit className="text-sm md:text-base" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(bounty.id);
                          }}
                          className="text-red hover:text-red-900 p-1"
                          title="Delete"
                        >
                          <FaTrash className="text-sm md:text-base" />
                        </button>
                        <button
                          onClick={() => toggleRowExpansion(bounty.id)}
                          className="text-gray hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                          title={expandedRows.has(bounty.id) ? "Collapse" : "Expand"}
                        >
                          {expandedRows.has(bounty.id) ? <FaChevronDown /> : <FaChevronRight />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRows.has(bounty.id) && (
                    <tr className="bg-gray-50">
                      <td colSpan={6} className="px-2 md:px-12 py-4 max-w-none">
                        <div className="overflow-hidden">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="md:hidden">
                              <span className="font-medium text-gray-700">Description:</span>
                              <p className="mt-1 text-gray-900 break-words">{bounty.description}</p>
                              <span className="font-medium text-gray-700 block mt-3">Expiry:</span>
                              <span className="text-gray-900">{bounty.expires_at ? new Date(bounty.expires_at).toLocaleDateString() : 'No expiry'}</span>
                            </div>
                            <div className="md:hidden">
                              <span className="font-medium text-gray-700">Full Details:</span>
                              <div className="mt-2 space-y-1">
                                <div className="break-all">ID: {bounty.id}</div>
                                <div className="break-words">Title: {bounty.title}</div>
                                <div>Reward: {bounty.reward} coins</div>
                                <div>Status: {bounty.status}</div>
                                <div>Expiry: {bounty.expires_at ? new Date(bounty.expires_at).toLocaleDateString() : 'No expiry'}</div>
                              </div>
                            </div>
                            <div className="hidden md:block">
                              <span className="font-medium text-gray-700">Additional Information:</span>
                              <div className="mt-2 space-y-1">
                                <div className="font-medium text-gray-700">Bounty ID: {bounty.id}</div>
                                <div className="font-medium text-gray-700">Current Status: {bounty.status}</div>
                                <div className="font-medium text-gray-700">Claims Left: {bounty.claims_left}</div>
                                <div className="font-medium text-gray-700">Max Claims: {bounty.max_claims}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-2 md:px-6 py-4 text-center text-gray-500">
                  No bounties available
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 md:p-6">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800">{editingBounty ? 'Edit Bounty' : 'Add Bounty'}</h3>
              <p className="text-sm text-gray-600 mt-1">Any new bounty added will appear on the live store.</p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Bounty Title */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Bounty Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter bounty title"
                  required
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe the bounty task"
                  required
                />
              </div>

              {/* Reward */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Reward (Coins)</label>
                <input
                  type="number"
                  value={formData.reward}
                  onChange={(e) => setFormData({...formData, reward: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="100"
                  min="1"
                  required
                />
              </div>

              {/* Max Claims */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Claims</label>
                <input
                  type="number"
                  value={formData.max_claims}
                  onChange={(e) => setFormData({...formData, max_claims: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="10"
                  min="1"
                  required
                />
              </div>

              {/* Expiry Date (Optional) */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date (Optional)</label>
                <input
                  type="datetime-local"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({...formData, expires_at: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for no expiry</p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingBounty(null);
                    setFormData({ title: '', description: '', reward: '', max_claims: '', expires_at: '' });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingBounty ? 'Update' : 'Create'} Bounty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      ) : (
        /* Results Tab - Shows bounty claims */
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto max-w-full">
            <table className="w-full table-fixed md:table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bounty</th>
                  <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="hidden md:table-cell px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                  <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-gray-50">
                    <td className="px-2 md:px-6 py-2 md:py-4 text-xs md:text-sm text-gray-900 max-w-24 md:max-w-none truncate" title={claim.user_username}>
                      {claim.user_username}
                    </td>
                    <td className="px-2 md:px-6 py-2 md:py-4 text-xs md:text-sm text-gray-900 max-w-32 md:max-w-none truncate" title={claim.bounty_title}>
                      {claim.bounty_title}
                    </td>
                    <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap">
                      <span className={`px-1 md:px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        claim.status === 'approved' ? 'bg-green text-green-800' :
                        claim.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                        claim.status === 'pending' ? 'bg-yellow text-yellow-800' : 'bg-red text-red-800'
                      }`}>
                        {claim.status}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                      {claim.submitted_at ? new Date(claim.submitted_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedClaim(claim);
                          setShowClaimModal(true);
                        }}
                        className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors text-xs"
                        title="View Details"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 md:p-6">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <FaTrash className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Bounty</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete this bounty? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red text-white rounded-md hover:bg-red transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Modals */}
      {deletingBounty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Deleting Bounty</h3>
              <p className="text-sm text-gray-500">Please wait while we delete the bounty...</p>
            </div>
          </div>
        </div>
      )}

      {creatingBounty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {editingBounty ? 'Updating Bounty' : 'Creating Bounty'}
              </h3>
              <p className="text-sm text-gray-500">
                Please wait while we {editingBounty ? 'update' : 'create'} the bounty...
              </p>
            </div>
          </div>
        </div>
      )}

      {approvingClaim && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Approving Claim</h3>
              <p className="text-sm text-gray-500">Please wait while we approve the bounty claim...</p>
            </div>
          </div>
        </div>
      )}

      {/* Claim Details Modal */}
      {showClaimModal && selectedClaim && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 md:p-6">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800">Claim Details</h3>
              <p className="text-sm text-gray-600 mt-1">Detailed information about this bounty claim</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-700">Claim ID:</span>
                  <p className="text-gray-900 mt-1">{selectedClaim.id}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">User:</span>
                  <p className="text-gray-900 mt-1">{selectedClaim.user_username}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Bounty:</span>
                  <p className="text-gray-900 mt-1">{selectedClaim.bounty_title}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <p className="text-gray-900 mt-1">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      selectedClaim.status === 'approved' ? 'bg-green text-green-800' :
                      selectedClaim.status === 'submitted' ? 'bg-blue text-blue-800' :
                      selectedClaim.status === 'pending' ? 'bg-yellow text-yellow-800' : 'bg-red text-red-800'
                    }`}>
                      {selectedClaim.status}
                    </span>
                  </p>
                </div>
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-700">Submitted At:</span>
                  <p className="text-gray-900 mt-1">
                    {selectedClaim.submitted_at ? new Date(selectedClaim.submitted_at).toLocaleString() : 'Not submitted'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-700">Submission:</span>
                  <p className="text-gray-900 mt-1 break-words">{selectedClaim.submission || 'No submission provided'}</p>
                </div>
                {selectedClaim.approved_at && (
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-700">Approved At:</span>
                    <p className="text-gray-900 mt-1">
                      {new Date(selectedClaim.approved_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              {selectedClaim.status === 'submitted' && (
                <button
                  onClick={approveClaim}
                  disabled={approvingClaim}
                  className="px-4 py-2 bg-green text-white rounded-md hover:bg-green disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {approvingClaim ? 'Approving...' : 'Approve Claim'}
                </button>
              )}
              <button
                onClick={() => {
                  setShowClaimModal(false);
                  setSelectedClaim(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

BountiesManagement.displayName = 'BountiesManagement';

export default BountiesManagement;
