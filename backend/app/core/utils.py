def number_to_indian_words(num: float) -> str:
    """
    Converts a number (float or int) into Indian Currency words.
    Example: 1200.0 -> "One Thousand Two Hundred Rupees Only"
             9600.0 -> "Nine Thousand Six Hundred Rupees Only"
             1500.50 -> "One Thousand Five Hundred Rupees and Fifty Paise Only"
    """
    if num is None:
        return "Zero Rupees Only"
    
    num = round(float(num), 2)
    if num == 0:
        return "Zero Rupees Only"

    units = [
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
        "Seventeen", "Eighteen", "Nineteen"
    ]
    tens = [
        "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    ]

    def two_digits(n):
        if n < 20:
            return units[n]
        else:
            ten_part = tens[n // 10]
            unit_part = units[n % 10]
            return f"{ten_part} {unit_part}".strip()

    def three_digits(n):
        hundred_part = n // 100
        rest = n % 100
        result = ""
        if hundred_part > 0:
            result += f"{units[hundred_part]} Hundred "
        if rest > 0:
            if result:
                result += "and "
            result += two_digits(rest)
        return result.strip()

    integer_part = int(num)
    decimal_part = int(round((num - integer_part) * 100))

    parts = []

    # Crores (1,00,00,000)
    crores = integer_part // 10000000
    integer_part %= 10000000
    if crores > 0:
        parts.append(f"{two_digits(crores)} Crore")

    # Lakhs (1,00,000)
    lakhs = integer_part // 100000
    integer_part %= 100000
    if lakhs > 0:
        parts.append(f"{two_digits(lakhs)} Lakh")

    # Thousands (1,000)
    thousands = integer_part // 1000
    integer_part %= 1000
    if thousands > 0:
        parts.append(f"{two_digits(thousands)} Thousand")

    # Hundreds and below (1 - 999)
    if integer_part > 0:
        parts.append(three_digits(integer_part))

    words = " ".join(parts).strip()
    if not words:
        words = "Zero"

    res = f"{words} Rupees"
    if decimal_part > 0:
        res += f" and {two_digits(decimal_part)} Paise"
    
    res += " Only"
    return res
