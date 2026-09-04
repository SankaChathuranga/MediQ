// src/components/shared/FormField.jsx
// Thin wrapper around MUI TextField/Select that consistently shows:
//   - the label
//   - helper text (optional)
//   - inline validation error text from React Hook Form
//
// Props (TextField mode — default):
//   name        {string}  — field name, must match RHF register() key
//   label       {string}  — visible label
//   register    {object}  — spread of RHF register(name, options)
//   error       {object}  — RHF fieldState.error object (has .message)
//   helperText  {string}  — (optional) non-error helper text
//   ...rest              — any other MUI TextField props (type, multiline, rows, etc.)
//
// Props (Select mode — pass select={true} + children):
//   select      {boolean} — renders MUI Select inside TextField
//   children    {node}    — <MenuItem> elements
//
// Usage (with React Hook Form):
//   const { register, formState: { errors } } = useForm();
//   <FormField
//     name="quantity"
//     label="Quantity"
//     type="number"
//     register={register('quantity', { required: 'Quantity is required' })}
//     error={errors.quantity}
//   />
//
//   <FormField
//     name="category"
//     label="Category"
//     select
//     register={register('category', { required: 'Category is required' })}
//     error={errors.category}
//   >
//     <MenuItem value="Painkiller">Painkiller</MenuItem>
//     <MenuItem value="Antibiotic">Antibiotic</MenuItem>
//   </FormField>

import React from 'react';
import TextField from '@mui/material/TextField';

export default function FormField({
  name,
  label,
  register,
  error,
  helperText,
  children,
  ...rest
}) {
  return (
    <TextField
      id={`field-${name}`}
      label={label}
      fullWidth
      error={!!error}
      helperText={error?.message || helperText || ' '}
      {...register}
      {...rest}
    >
      {children}
    </TextField>
  );
}
