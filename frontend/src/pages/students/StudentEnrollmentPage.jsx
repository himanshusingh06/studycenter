import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Mail, MapPin, GraduationCap, ShieldAlert, CheckCircle, ArrowLeft, DollarSign } from 'lucide-react';
import api from '../../api/client';
import PhotoUploader from '../../components/students/PhotoUploader';

const StudentEnrollmentPage = () => {
  const navigate = useNavigate();
  const [feeStructures, setFeeStructures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    dob: '',
    gender: 'Male',
    mobile: '',
    alt_mobile: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    guardian_name: '',
    guardian_relation: 'Father',
    guardian_mobile: '',
    guardian_email: '',
    guardian_address: '',
    course: '',
    college: '',
    qualification: '',
    academic_year: '2025-2026',
    emergency_contact_name: '',
    emergency_contact_number: '',
    emergency_relation: '',
    seat_number: '',
    preferred_timing: 'Full Day (8 AM - 8 PM)',
    fee_structure_id: '',
    custom_monthly_fee: '',
    fee_discount: 0,
    billing_cycle: 'MONTHLY',
    fee_due_day: 5,
    photo_url: ''
  });

  useEffect(() => {
    api.get('/fees/structures').then(res => {
      setFeeStructures(res.data);
      if (res.data.length > 0) {
        setForm(f => ({ ...f, fee_structure_id: res.data[0].id }));
      }
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.mobile) {
      setError('Please fill in required fields: First Name, Last Name, and Mobile Number.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...form,
        fee_structure_id: form.fee_structure_id ? Number(form.fee_structure_id) : null,
        custom_monthly_fee: form.custom_monthly_fee !== '' ? Number(form.custom_monthly_fee) : null,
        fee_discount: Number(form.fee_discount || 0),
        fee_due_day: Number(form.fee_due_day || 5),
        dob: form.dob || null
      };
      const res = await api.post('/students', payload);
      navigate(`/students/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to enroll student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      <div className="flex items-center space-x-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">New Student Enrollment</h1>
          <p className="text-sm text-slate-400">Register student, assign study desk shift, and configure fee structure plan</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Photo & Personal Information */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <User className="h-5 w-5 text-brand-400" />
            <span>Personal Information</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <PhotoUploader
                value={form.photo_url}
                onChange={(url) => setForm(f => ({ ...f, photo_url: url }))}
              />
            </div>

            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">First Name *</label>
                <input
                  type="text"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Rahul"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Middle Name</label>
                <input
                  type="text"
                  name="middle_name"
                  value={form.middle_name}
                  onChange={handleChange}
                  placeholder="e.g. Kumar"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Last Name *</label>
                <input
                  type="text"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Sharma"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Gender</label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Mobile Number *</label>
                <input
                  type="text"
                  name="mobile"
                  value={form.mobile}
                  onChange={handleChange}
                  required
                  placeholder="10 digit mobile"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="rahul@example.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Guardian & Address Details */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-emerald-400" />
            <span>Guardian & Address Information</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Guardian Name</label>
              <input
                type="text"
                name="guardian_name"
                value={form.guardian_name}
                onChange={handleChange}
                placeholder="Parent / Guardian"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Guardian Relationship</label>
              <input
                type="text"
                name="guardian_relation"
                value={form.guardian_relation}
                onChange={handleChange}
                placeholder="Father / Mother / Guardian"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Guardian Mobile</label>
              <input
                type="text"
                name="guardian_mobile"
                value={form.guardian_mobile}
                onChange={handleChange}
                placeholder="Guardian Phone"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Academic & Fee Plan Mapping Setup */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-emerald-400" />
            <span>Fee Structure Plan & Custom Pricing</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Course / Exam Target</label>
              <input
                type="text"
                name="course"
                value={form.course}
                onChange={handleChange}
                placeholder="e.g. UPSC / NEET / CA / GATE"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Assigned Desk / Seat #</label>
              <input
                type="text"
                name="seat_number"
                value={form.seat_number}
                onChange={handleChange}
                placeholder="e.g. Desk A-12"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Select Fee Plan Structure *</label>
              <select
                name="fee_structure_id"
                value={form.fee_structure_id}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500 font-bold"
              >
                {feeStructures.map(fs => (
                  <option key={fs.id} value={fs.id}>
                    {fs.name} - ₹{fs.monthly_fee}/month (One-time: ₹{fs.one_time_fee})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Custom Monthly Fee (₹) <span className="text-slate-500 lowercase">(optional override)</span>
              </label>
              <input
                type="number"
                name="custom_monthly_fee"
                value={form.custom_monthly_fee}
                onChange={handleChange}
                placeholder="Leave blank for standard rate"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Recurring Concession / Discount (₹)
              </label>
              <input
                type="number"
                name="fee_discount"
                value={form.fee_discount}
                onChange={handleChange}
                placeholder="0"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-emerald-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Billing Cycle</label>
              <select
                name="billing_cycle"
                value={form.billing_cycle}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly (3 Months)</option>
                <option value="HALF_YEARLY">Half Yearly (6 Months)</option>
                <option value="YEARLY">Yearly (12 Months)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Fee Due Day of Month</label>
              <input
                type="number"
                min={1}
                max={28}
                name="fee_due_day"
                value={form.fee_due_day}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-medium text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-7 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-xl shadow-brand-600/30 transition-all flex items-center space-x-2"
          >
            {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1"></div>}
            <span>Complete Enrollment & Generate Student ID</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentEnrollmentPage;
