'use client'

import { useState } from 'react'
import { loginWithCode } from '@/lib/actions'

export function PinPad({ hasError }: { hasError: boolean }) {
  const [digits, setDigits] = useState('')

  return (
    <form action={loginWithCode} className="pin-pad">
      <label className="pin-field">
        <span>الرمز السري</span>
        <input
          name="code"
          type="password"
          inputMode="numeric"
          pattern="[0-9]{4}"
          maxLength={4}
          autoComplete="off"
          autoFocus
          value={digits}
          onChange={(event) => setDigits(event.target.value.replace(/\D/g, '').slice(0, 4))}
        />
      </label>
      {hasError && <p className="admin-login-error">كود غير صحيح</p>}
      <button type="submit" className="pin-submit" disabled={digits.length !== 4}>
        دخول
      </button>
    </form>
  )
}
