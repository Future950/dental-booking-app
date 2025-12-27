import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, Mail, CheckCircle, AlertCircle } from 'lucide-react';

export default function DentalBookingApp() {
  const [appointments, setAppointments] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    date: '',
    time: '',
    consultationType: 'initial',
    notes: ''
  });
  const [apiKey, setApiKey] = useState('');
  const [senderId, setSenderId] = useState('');
  const [showApiSetup, setShowApiSetup] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  // Load stored API credentials and appointments
  useEffect(() => {
    const stored = localStorage.getItem('arkesel_credentials');
    if (stored) {
      const creds = JSON.parse(stored);
      setApiKey(creds.apiKey);
      setSenderId(creds.senderId);
      setShowApiSetup(false);
    }
    
    const storedAppts = localStorage.getItem('appointments');
    if (storedAppts) {
      setAppointments(JSON.parse(storedAppts));
    }
  }, []);

  const saveCredentials = () => {
    if (!apiKey || !senderId) {
      setStatus({ type: 'error', message: 'Please enter both API Key and Sender ID' });
      return;
    }
    localStorage.setItem('arkesel_credentials', JSON.stringify({ apiKey, senderId }));
    setShowApiSetup(false);
    setStatus({ type: 'success', message: 'API credentials saved!' });
  };

  const sendSMS = async (phone, message) => {
    try {
      const response = await fetch('https://sms.arkesel.com/api/v2/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey
        },
        body: JSON.stringify({
          sender: senderId,
          message: message,
          recipients: [phone]
        })
      });

      const data = await response.json();
      return response.ok;
    } catch (error) {
      console.error('SMS Error:', error);
      return false;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setStatus({ type: '', message: '' });

    // Validate phone number (Ghana format)
    const phoneRegex = /^(?:\+233|0)[2-5]\d{8}$/;
    if (!phoneRegex.test(formData.phone)) {
      setStatus({ type: 'error', message: 'Please enter a valid Ghana phone number' });
      setLoading(false);
      return;
    }

    const appointment = {
      ...formData,
      id: Date.now(),
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    // Save appointment
    const updatedAppointments = [...appointments, appointment];
    setAppointments(updatedAppointments);
    localStorage.setItem('appointments', JSON.stringify(updatedAppointments));

    // Send SMS confirmation
    const consultationTypes = {
      initial: 'Initial Consultation',
      followup: 'Follow-up',
      fitting: 'Braces Fitting',
      adjustment: 'Adjustment'
    };

    const smsMessage = `Hello ${formData.name}, your dental appointment for ${consultationTypes[formData.consultationType]} has been confirmed for ${formData.date} at ${formData.time}. We look forward to seeing you! - Dental Clinic`;

    const smsSent = await sendSMS(formData.phone, smsMessage);

    if (smsSent) {
      setStatus({ type: 'success', message: 'Appointment booked successfully! SMS confirmation sent.' });
    } else {
      setStatus({ type: 'warning', message: 'Appointment booked, but SMS notification failed. Please check your API credentials.' });
    }

    // Reset form
    setFormData({
      name: '',
      phone: '',
      email: '',
      date: '',
      time: '',
      consultationType: 'initial',
      notes: ''
    });

    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const deleteAppointment = (id) => {
    const updated = appointments.filter(apt => apt.id !== id);
    setAppointments(updated);
    localStorage.setItem('appointments', JSON.stringify(updated));
    setStatus({ type: 'success', message: 'Appointment deleted' });
  };

  if (showApiSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Arkesel API Setup</h1>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your Arkesel API key"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sender ID
                </label>
                <input
                  type="text"
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., DentalCare"
                />
              </div>
            </div>

            <button
              onClick={saveCredentials}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Save & Continue
            </button>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Note:</strong> Get your API key from{' '}
                <a href="https://sms.arkesel.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  sms.arkesel.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Dental Braces Consultation</h1>
          <p className="text-gray-600">Book your appointment for a beautiful smile</p>
          <button
            onClick={() => setShowApiSetup(true)}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            Configure API Settings
          </button>
        </div>

        {status.message && (
          <div className={`mb-6 p-4 rounded-lg flex items-start ${
            status.type === 'success' ? 'bg-green-50 text-green-800' :
            status.type === 'error' ? 'bg-red-50 text-red-800' :
            'bg-yellow-50 text-yellow-800'
          }`}>
            {status.type === 'success' ? <CheckCircle className="mr-2 mt-0.5" size={20} /> : <AlertCircle className="mr-2 mt-0.5" size={20} />}
            <span>{status.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Booking Form */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Book Appointment</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline mr-2" size={16} />
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="inline mr-2" size={16} />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0241234567 or +233241234567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline mr-2" size={16} />
                  Email (Optional)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline mr-2" size={16} />
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline mr-2" size={16} />
                    Time
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Consultation Type
                </label>
                <select
                  name="consultationType"
                  value={formData.consultationType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="initial">Initial Consultation</option>
                  <option value="followup">Follow-up</option>
                  <option value="fitting">Braces Fitting</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any special requirements or concerns?"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400"
              >
                {loading ? 'Booking...' : 'Book Appointment'}
              </button>
            </div>
          </div>

          {/* Appointments List */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Scheduled Appointments</h2>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {appointments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No appointments scheduled yet</p>
              ) : (
                appointments.map(apt => (
                  <div key={apt.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-800">{apt.name}</h3>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {apt.status}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><Phone size={14} className="inline mr-2" />{apt.phone}</p>
                      {apt.email && <p><Mail size={14} className="inline mr-2" />{apt.email}</p>}
                      <p><Calendar size={14} className="inline mr-2" />{apt.date} at {apt.time}</p>
                      <p className="font-medium text-blue-600">{apt.consultationType.charAt(0).toUpperCase() + apt.consultationType.slice(1)}</p>
                      {apt.notes && <p className="italic">{apt.notes}</p>}
                    </div>

                    <button
                      onClick={() => deleteAppointment(apt.id)}
                      className="mt-3 text-red-600 text-sm hover:underline"
                    >
                      Cancel Appointment
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}