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
  const [editingBounty, setEditingBounty] = useState<Bounty | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reward: '',
    max_claims: '',
    expires_at: ''
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bountiesResponse, claimsResponse] = await Promise.all([
        apiService.getBounties(),
        apiService.getUserClaims()
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

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this bounty?')) {
      try {
        await apiService.deleteBounty(id);
        await loadData(); // Refresh data
      } catch (error) {
        console.error('Failed to delete bounty:', error);
        alert('Failed to delete bounty. Please try again.');
      }
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
            {bounties.map((bounty) => (
              <>
                <tr key={bounty.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleRowExpansion(bounty.id)}>
                  <td className="px-2 md:px-6 py-2 md:py-4 text-xs md:text-sm text-gray-900 max-w-32 md:max-w-none truncate md:whitespace-nowrap" title={bounty.title}>{bounty.title}</td>
                  <td className="hidden md:table-cell px-2 md:px-6 py-2 md:py-4 text-xs md:text-sm text-gray-900 max-w-xs truncate">{bounty.description}</td>
                  <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">{bounty.reward} coins</td>
                  <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap">
                    <span className={`px-1 md:px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      bounty.status === 'available' ? 'bg-green-100 text-green-800' :
                      bounty.status === 'full' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
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
                    <td colSpan={6} className="px-4 md:px-12 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="md:hidden">
                          <span className="font-medium text-gray-700">Description:</span>
                          <p className="mt-1 text-gray-900">{bounty.description}</p>
                          <span className="font-medium text-gray-700 block mt-3">Expiry:</span>
                          <span className="text-gray-900">{bounty.expires_at ? new Date(bounty.expires_at).toLocaleDateString() : 'No expiry'}</span>
                        </div>
                        <div className="md:hidden">
                          <span className="font-medium text-gray-700">Full Details:</span>
                          <div className="mt-2 space-y-1">
                            <div>ID: {bounty.id}</div>
                            <div>Title: {bounty.title}</div>
                            <div>Reward: {bounty.reward} coins</div>
                            <div>Status: {bounty.status}</div>
                            <div>Expiry: {bounty.expires_at ? new Date(bounty.expires_at).toLocaleDateString() : 'No expiry'}</div>
                          </div>
                        </div>
                        <div className="hidden md:block">
                          <span className="font-medium text-gray-700">Additional Information:</span>
                          <div className="mt-2 space-y-1">
                            <div>Bounty ID: {bounty.id}</div>
                            <div>Current Status: {bounty.status}</div>
                            <div>Participants: 0</div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
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
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 text-center text-gray-500">
            <p>Results tab is currently under development.</p>
            <p className="text-sm mt-2">Please use the Create tab to manage bounties.</p>
          </div>
        </div>
      )}
    </div>
  );
});

BountiesManagement.displayName = 'BountiesManagement';

export default BountiesManagement;
