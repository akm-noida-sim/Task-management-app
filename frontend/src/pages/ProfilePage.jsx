import { useEffect, useState } from 'react';
import { KeyRound, UserRound } from 'lucide-react';
import Field from '../components/Field';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { authService } from '../services/authService';
import { formatDateTime, initials } from '../utils/formatters';
import { validatePasswordChange, validateProfile } from '../utils/validators';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [password, setPassword] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) setProfile({ name: user.name || '', email: user.email || '' });
  }, [user]);

  const changeProfile = (event) => {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
    setProfileErrors((current) => ({ ...current, [name]: undefined }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    const found = validateProfile(profile);
    if (Object.keys(found).length) {
      setProfileErrors(found);
      return;
    }
    setSavingProfile(true);
    setProfileError('');
    try {
      await authService.updateProfile({ name: profile.name.trim(), email: profile.email.trim() });
      await refreshUser();
      showSuccess('Profile updated successfully.');
    } catch (error) {
      setProfileError(getErrorMessage(error, 'Unable to update your profile.'));
    } finally {
      setSavingProfile(false);
    }
  };

  const changePasswordField = (event) => {
    const { name, value } = event.target;
    setPassword((current) => ({ ...current, [name]: value }));
    setPasswordErrors((current) => ({ ...current, [name]: undefined }));
  };

  const savePassword = async (event) => {
    event.preventDefault();
    const found = validatePasswordChange(password);
    if (Object.keys(found).length) {
      setPasswordErrors(found);
      return;
    }
    setSavingPassword(true);
    try {
      await authService.changePassword({
        current_password: password.current_password,
        new_password: password.new_password,
      });
      setPassword({ current_password: '', new_password: '', confirm_password: '' });
      showSuccess('Password changed successfully.');
    } catch (error) {
      showError(getErrorMessage(error, 'Unable to change your password.'));
    } finally {
      setSavingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="card flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner label="Loading profile…" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Profile & settings</h1>
        <p className="muted mt-1">Manage your account details and security.</p>
      </div>

      <div className="card flex flex-wrap items-center gap-4 p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-xl font-bold text-white">
          {initials(user.name)}
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">{user.name}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
          <p className="mt-1 text-xs text-slate-400">Member since {formatDateTime(user.created_at)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={saveProfile} noValidate className="card p-6">
          <div className="mb-5 flex items-center gap-2">
            <UserRound className="h-5 w-5 text-brand-600" aria-hidden="true" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Personal details</h2>
          </div>
          {profileError && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300" role="alert">
              {profileError}
            </div>
          )}
          <div className="space-y-5">
            <Field label="Full name" htmlFor="profile-name" error={profileErrors.name}>
              <input id="profile-name" name="name" className="input" value={profile.name} onChange={changeProfile} />
            </Field>
            <Field label="Email address" htmlFor="profile-email" error={profileErrors.email}>
              <input id="profile-email" name="email" type="email" className="input" value={profile.email} onChange={changeProfile} />
            </Field>
            <button type="submit" className="btn-primary" disabled={savingProfile}>
              {savingProfile ? <LoadingSpinner label="Saving…" small /> : 'Save changes'}
            </button>
          </div>
        </form>

        <form onSubmit={savePassword} noValidate className="card p-6">
          <div className="mb-5 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-brand-600" aria-hidden="true" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Change password</h2>
          </div>
          <div className="space-y-5">
            <Field label="Current password" htmlFor="current_password" error={passwordErrors.current_password}>
              <input
                id="current_password"
                name="current_password"
                type="password"
                autoComplete="current-password"
                className="input"
                value={password.current_password}
                onChange={changePasswordField}
              />
            </Field>
            <Field label="New password" htmlFor="new_password" error={passwordErrors.new_password} hint="At least 8 characters.">
              <input
                id="new_password"
                name="new_password"
                type="password"
                autoComplete="new-password"
                className="input"
                value={password.new_password}
                onChange={changePasswordField}
              />
            </Field>
            <Field label="Confirm new password" htmlFor="confirm_password" error={passwordErrors.confirm_password}>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                autoComplete="new-password"
                className="input"
                value={password.confirm_password}
                onChange={changePasswordField}
              />
            </Field>
            <button type="submit" className="btn-primary" disabled={savingPassword}>
              {savingPassword ? <LoadingSpinner label="Updating…" small /> : 'Update password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
