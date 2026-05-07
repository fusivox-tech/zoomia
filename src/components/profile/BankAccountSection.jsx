import { useState, useEffect } from 'react';
import { Banknote, Edit2, Plus, X, AlertCircle, CreditCard, Trash2, Info, Eye, Shield, Check } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from '../../config';
import { useData } from '../../contexts/DataContext';

const BankAccountSection = ({ user, onBankAccountChange }) => {
  const { showSuccess, showError } = useData();
  const [bankAccount, setBankAccount] = useState(null);
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankForm, setBankForm] = useState({
    accountNumber: '',
    bankCode: '',
    bankName: ''
  });
  const [banks, setBanks] = useState([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [verifyingBank, setVerifyingBank] = useState(false);
  const [selectedBank, setSelectedBank] = useState('');
  const [bankError, setBankError] = useState('');
  const [verifiedAccount, setVerifiedAccount] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    fetchBanks();
  }, []);

  useEffect(() => {
    if (user && user.bankAccount) {
      const bank = banks.find(b => b.code === user.bankAccount.bankCode);
      setBankAccount({
        ...user.bankAccount,
        bankName: bank?.name || user.bankAccount.bankName
      });
    } else {
      setBankAccount(null);
    }
  }, [user, banks]);

  const fetchBanks = async () => {
    setBankLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/banks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setBanks(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching banks:', error);
    } finally {
      setBankLoading(false);
    }
  };

  const verifyBankAccount = async () => {
    if (!bankForm.accountNumber || !bankForm.bankCode) {
      setBankError('Please fill in all required fields');
      return;
    }
    
    if (bankForm.accountNumber.length !== 10) {
      setBankError('Account number must be 10 digits');
      return;
    }
    
    setVerifyingBank(true);
    setBankError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/user/bank-account/verify`, {
        accountNumber: bankForm.accountNumber,
        bankCode: bankForm.bankCode
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const selectedBankData = banks.find(b => b.code === bankForm.bankCode);
        setVerifiedAccount({
          ...response.data.data,
          bankName: selectedBankData?.name || ''
        });
        setShowConfirmation(true);
      }
    } catch (error) {
      setBankError(error.response?.data?.message || 'Failed to verify bank account');
    } finally {
      setVerifyingBank(false);
    }
  };

  const saveBankAccount = async () => {
    if (!verifiedAccount) return;
    
    setVerifyingBank(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/user/bank-account`, {
        accountNumber: verifiedAccount.accountNumber,
        bankCode: verifiedAccount.bankCode,
        accountName: verifiedAccount.accountName,
        bankName: verifiedAccount.bankName
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        showSuccess(response.data.message || 'Bank account saved successfully');
        window.location.reload();
      }
    } catch (error) {
      setBankError(error.response?.data?.message || 'Failed to save bank account');
      setVerifyingBank(false);
    }
  };

  const removeBankAccount = async () => {
    if (!window.confirm('Are you sure you want to remove your bank account?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_BASE_URL}/user/bank-account`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        showSuccess('Bank account removed successfully!');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error removing bank account:', error);
      showError('Failed to remove bank account');
    }
  };

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Banknote className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-gray-900">Payout Account</h3>
        </div>
        {!showBankForm && !showConfirmation && (
          <button
            onClick={() => {
              setShowBankForm(true);
              setBankError('');
              setVerifiedAccount(null);
            }}
            className="text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1"
          >
            {bankAccount ? (
              <>
                <Edit2 className="w-4 h-4" />
                Change <span className="hidden md:inline-block">Account</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add Bank <span className="hidden md:inline-block">Account</span>
              </>
            )}
          </button>
        )}
      </div>
      
      {!showBankForm && !showConfirmation ? (
        bankAccount ? (
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full hidden md:flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{bankAccount.bankName || 'Bank Account'}</p>
                  <p className="text-lg font-mono font-bold text-gray-900">{bankAccount.accountNumber}</p>
                  <p className="text-sm text-gray-700 mt-1">
                    Account Name: {bankAccount.verifiedAccountName || bankAccount.accountName}
                  </p>
                </div>
              </div>
              <button
                onClick={removeBankAccount}
                className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 pt-3 border-t border-green-200">
              <p className="text-xs text-gray-600 flex items-center gap-1">
                <Info className="hidden md:inline-flex w-3 h-3" />
                This account will be used for payouts when you sell products on Zoommia or for refunds
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-gray-50 rounded-lg text-center border-2 border-dashed border-gray-200">
            <Banknote className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No bank account added</p>
            <p className="text-xs text-gray-400 mt-1">Add a bank account to receive payouts for your sales</p>
          </div>
        )
      ) : showConfirmation && verifiedAccount ? (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-gray-900">Verify Bank Account Details</h4>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-gray-600 mb-2">We've verified this account with Paystack:</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Bank:</span>
                <span className="font-medium text-gray-900">
                  {banks.find(b => b.code === verifiedAccount.bankCode)?.name || 'Selected Bank'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Account Number:</span>
                <span className="font-mono font-bold text-gray-900">{verifiedAccount.accountNumber}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-green-200">
                <span className="text-sm text-gray-500">Account Name:</span>
                <span className="font-semibold text-green-700">{verifiedAccount.accountName}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              onClick={saveBankAccount}
              disabled={verifyingBank}
              className="flex-1 bg-green-500 text-white py-2 rounded-lg font-semibold hover:bg-green-600 transition"
            >
              {verifyingBank ? 'Saving...' : (bankAccount ? 'Yes, Update Account' : 'Yes, Add Account')}
            </button>
            <button
              onClick={() => {
                setShowConfirmation(false);
                setVerifiedAccount(null);
                setShowBankForm(true);
              }}
              className="flex-1 border border-gray-300 py-2 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              No, Go Back
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">
              {bankAccount ? 'Change Bank Account' : 'Add Bank Account'}
            </h4>
            <button
              onClick={() => {
                setShowBankForm(false);
                setBankError('');
                setBankForm({ accountNumber: '', bankCode: '', bankName: '' });
                setSelectedBank('');
                setVerifiedAccount(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {bankError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-sm text-red-600">{bankError}</p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Bank <span className="text-red-500">*</span></label>
            <select
              value={selectedBank}
              onChange={(e) => {
                const selected = e.target.value;
                setSelectedBank(selected);
                const bank = banks.find(b => b.code === selected);
                setBankForm(prev => ({ 
                  ...prev, 
                  bankCode: selected,
                  bankName: bank?.name || ''
                }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              disabled={bankLoading}
            >
              <option value="">Select your bank</option>
              {banks.map(bank => (
                <option key={bank.code} value={bank.code}>{bank.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Number <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={bankForm.accountNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                setBankForm(prev => ({ ...prev, accountNumber: value }));
              }}
              placeholder="0123456789"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              maxLength="10"
            />
            <p className="text-xs text-gray-500 mt-1">10-digit account number</p>
          </div>
          
          {bankForm.bankCode && bankForm.accountNumber.length === 10 && (
            <div className="p-3 bg-blue-50 rounded-lg flex items-start gap-2">
              <Eye className="w-4 h-4 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 font-medium">Preview Available</p>
                <p className="text-xs text-blue-700">We'll verify this account and show you the account name before saving</p>
              </div>
            </div>
          )}
          
          <div className="flex gap-3 pt-2">
            <button
              onClick={verifyBankAccount}
              disabled={verifyingBank || !bankForm.accountNumber || !bankForm.bankCode}
              className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 transition"
            >
              {verifyingBank ? 'Verifying...' : 'Verify Account'}
            </button>
            <button
              onClick={() => setShowBankForm(false)}
              className="flex-1 border border-gray-300 py-2 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
          
          <p className="text-xs text-gray-500 text-center">
            We'll verify your account with Paystack and show you the account name for confirmation
          </p>
        </div>
      )}
    </div>
  );
};

export default BankAccountSection;