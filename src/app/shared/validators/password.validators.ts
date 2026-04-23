/**
 * Shared Password Strength Validator
 * Requires: min 8 chars, 1 uppercase, 1 number, 1 special character.
 */

import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const passwordStrengthValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value: string = control.value || '';
  const errors: ValidationErrors = {};

  if (!/[A-Z]/.test(value))   errors['noUppercase']  = true;
  if (!/[0-9]/.test(value))   errors['noNumber']     = true;
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) errors['noSpecial'] = true;

  return Object.keys(errors).length ? errors : null;
};

/** Cross-field validator: password and password_confirmation must match. */
export const passwordMatchValidator = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirm  = control.get('password_confirmation')?.value;
  return password && confirm && password !== confirm ? { passwordMismatch: true } : null;
};

/** Cross-field validator for change-password form: newPassword and confirmPassword must match. */
export const changePasswordMatchValidator = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('newPassword')?.value;
  const confirm  = control.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { passwordMismatch: true } : null;
};
