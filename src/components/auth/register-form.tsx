'use client';

import { useState } from 'react';
import { useAuth } from './auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RegisterFormProps {
  onSuccess?: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    if (password.length < 8) {
      setError('הסיסמה חייבת להכיל לפחות 8 תווים');
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        username,
        password,
        displayName,
        email: email || undefined,
      });

      if (result.success) {
        onSuccess?.();
      } else {
        setError(result.message || 'הרשמה נכשלה');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="register-username">שם משתמש</Label>
        <Input
          id="register-username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={loading}
          placeholder="אותיות אנגליות ומספרים בלבד"
          pattern="[a-zA-Z0-9_]{3,50}"
        />
        <p className="text-xs text-muted-foreground">3-50 תווים (אותיות אנגליות, מספרים וקו תחתון)</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-displayName">שם מלא</Label>
        <Input
          id="register-displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          disabled={loading}
          placeholder="השם שיוצג בפוסטים שלך"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-email">אימייל (אופציונלי)</Label>
        <Input
          id="register-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          placeholder="your@email.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">סיסמה</Label>
        <Input
          id="register-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          placeholder="לפחות 8 תווים"
          minLength={8}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-confirmPassword">אימות סיסמה</Label>
        <Input
          id="register-confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={loading}
          placeholder="הזן את הסיסמה שוב"
        />
      </div>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 text-center">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'נרשם...' : 'הרשם'}
      </Button>
    </form>
  );
}
