type ClassValue = string | number | boolean | undefined | null | ClassValue[] | Record<string, boolean>

export function cn(...inputs: ClassValue[]) {
  return inputs
    .flat()
    .filter((input): input is string => typeof input === 'string' && input.length > 0)
    .join(' ')
}