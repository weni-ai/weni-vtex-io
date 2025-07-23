/**
 * Phone number validator utility
 * Detects fake/test phone numbers based on patterns
 */

/**
 * Check if a phone number should be ignored (fake/test numbers)
 * @param phone - Phone number to check
 * @returns true if the number should be ignored, false otherwise
 */
export function isPhoneNumberIgnored(phone: string): boolean {
  if (!phone) return false

  // Clean phone number (remove all non-digit characters)
  const cleanPhone = phone.replace(/\D/g, '')

  // Check for patterns that indicate fake numbers
  return isFakeNumberPattern(cleanPhone)
}

/**
 * Check if a phone number follows fake number patterns
 * @param cleanPhone - Clean phone number (digits only)
 * @returns true if the number follows fake patterns, false otherwise
 */
export function isFakeNumberPattern(cleanPhone: string): boolean {
  if (!cleanPhone || cleanPhone.length < 8) return false

  // Pattern 1: All digits are the same (e.g., 11111111111, 22222222222)
  if (/^(.)\1*$/.test(cleanPhone)) {
    return true
  }

  // Pattern 2: Check if numbers after country prefix are all the same
  // This handles cases like 55222222222, 12333333333, etc.
  if (cleanPhone.length >= 10) {
    // Try different country code lengths (1, 2, 3, 4 digits)
    for (let i = 1; i <= 4; i++) {
      const afterCountryCode = cleanPhone.slice(i)

      // Check if remaining digits are all the same and have at least 6 digits
      if (afterCountryCode.length >= 6 && /^(.)\1*$/.test(afterCountryCode)) {
        return true
      }
    }
  }

  return false
}

/**
 * Clean phone number by removing all non-digit characters
 * @param phone - Phone number to clean
 * @returns Clean phone number with only digits
 */
export function cleanPhoneNumber(phone: string): string {
  if (!phone) return ''

  return phone.replace(/\D/g, '')
}

/**
 * Get phone number parts after country code
 * @param cleanPhone - Clean phone number (digits only)
 * @returns Array of possible phone number parts after different country code lengths
 */
export function getPhoneNumberParts(cleanPhone: string): string[] {
  if (!cleanPhone || cleanPhone.length < 8) return []

  const parts: string[] = []

  for (let i = 1; i <= 4; i++) {
    const part = cleanPhone.slice(i)

    if (part.length >= 6) {
      parts.push(part)
    }
  }

  return parts
}
