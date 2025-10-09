import re
from typing import Dict, Pattern, Any, List

class BillParser:
    def __init__(self) -> None:
        # Define regex patterns for common bill data fields
        self.patterns: Dict[str, Pattern[str]] = {
            "bill_number": re.compile(r"(?:Account Number|Account No|Invoice Number|Bill No|Reference No)[:\s]*([\w-]+)", re.IGNORECASE),
            "total_amount": re.compile(r"(?:Total Amount|Amount Due|Balance Due)[:\s]*[\$€£¥]?\s*([\d.,]+)", re.IGNORECASE),
            "currency": re.compile(r"(?:Total Amount|Amount Due|Balance Due)[:\s]*([\$€£¥])", re.IGNORECASE), # Capture the currency symbol
            "customer_name": re.compile(r"(?:Customer Name|Client Name|Name|To)[:\s]*([A-Z][a-z]+(?:\s[A-Z][a-z]+){1,3})", re.IGNORECASE), # Placeholder, as it's not in the sample PDF
            "remittance_coupon_keywords": re.compile(r"(?:Remittance Coupon|Payment Stub|Please Detach|Return with Payment|please return bottom portion with your payment)", re.IGNORECASE)
        }
        self.free_text_patterns: Dict[str, Pattern[str]] = {
            "payee": re.compile(r"Pay to the order of (.*?)(?: the sum| on or before)", re.IGNORECASE),
            "amount": re.compile(r"the sum of (?:[$€£¥])?\s*([\d,.]+)", re.IGNORECASE),
            "currency": re.compile(r"the sum of ([\$€£¥])", re.IGNORECASE),
            "due_date": re.compile(r"on or before (.*)", re.IGNORECASE)
        }

    def parse_free_text_bill(self, bill_text: str) -> Dict[str, Any]:
        bill_data: Dict[str, Any] = {}

        payee_match = self.free_text_patterns["payee"].search(bill_text)
        if payee_match:
            bill_data["payee"] = payee_match.group(1).strip()

        amount_match = self.free_text_patterns["amount"].search(bill_text)
        if amount_match:
            bill_data["total_amount"] = float(amount_match.group(1).replace(',', ''))

        currency_match = self.free_text_patterns["currency"].search(bill_text)
        if currency_match:
            currency_symbol = currency_match.group(1)
            if currency_symbol == "$":
                bill_data["currency"] = "USD"
            elif currency_symbol == "€":
                bill_data["currency"] = "EUR"
            elif currency_symbol == "£":
                bill_data["currency"] = "GBP"
            elif currency_symbol == "¥":
                bill_data["currency"] = "JPY"

        due_date_match = self.free_text_patterns["due_date"].search(bill_text)
        if due_date_match:
            bill_data["due_date"] = due_date_match.group(1).strip().replace('.', '')

        return bill_data

    def find_remittance_coupon(self, bill_text: str) -> str:
        coupon_text = ""
        lines: List[str] = bill_text.split('\n')
        found_coupon: bool = False
        coupon_start_line: int = -1

        for i, line in enumerate(lines):
            if self.patterns["remittance_coupon_keywords"].search(line):
                found_coupon = True
                coupon_start_line = i
                break
        
        if found_coupon:
            for i in range(coupon_start_line, min(coupon_start_line + 10, len(lines))):
                coupon_text += lines[i] + "\n"
        
        return coupon_text.strip()

    def parse_bill(self, bill_text: str) -> Dict[str, Any]:
        structured_data = self.parse_structured_bill(bill_text)
        if structured_data.get("bill_number"):
            return structured_data

        free_text_data = self.parse_free_text_bill(bill_text)
        if free_text_data:
            return free_text_data

        return {}

    def parse_structured_bill(self, bill_text: str) -> Dict[str, Any]:
        bill_data: Dict[str, Any] = {}
        
        match = self.patterns["bill_number"].search(bill_text)
        if match:
            bill_data["bill_number"] = match.group(1).strip()
        
        amount_currency_match = re.search(
            r"(?:Total Amount|Amount Due|Balance Due)[:\s]*([\$€£¥]?)\s*([\d.,]+)",
            bill_text,
            re.IGNORECASE
        )
        if amount_currency_match:
            currency_symbol = amount_currency_match.group(1)
            amount_str = amount_currency_match.group(2)

            if ',' in amount_str and '.' in amount_str:
                if amount_str.find(',') < amount_str.find('.'):
                    amount_str = amount_str.replace(',', '')
                else:
                    amount_str = amount_str.replace('.', '').replace(',', '.')
            elif ',' in amount_str:
                pass
            
            try:
                bill_data["total_amount"] = float(amount_str)
            except ValueError:
                bill_data["total_amount"] = "N/A"
            
            if currency_symbol == "$":
                bill_data["currency"] = "USD"
            elif currency_symbol == "€":
                bill_data["currency"] = "EUR"
            elif currency_symbol == "£":
                bill_data["currency"] = "GBP"
            elif currency_symbol == "¥":
                bill_data["currency"] = "JPY"
            else:
                bill_data["currency"] = "N/A"
        else:
            bill_data["total_amount"] = "N/A"
            bill_data["currency"] = "N/A"

        match = self.patterns["customer_name"].search(bill_text)
        if match:
            bill_data["customer_name"] = match.group(1).strip()
        else:
            bill_data["customer_name"] = "Valued Customer"

        remittance_coupon_text = self.find_remittance_coupon(bill_text)
        if remittance_coupon_text:
            print(f"\n--- Remittance Coupon Found ---\n{remittance_coupon_text}\n---")

        return bill_data
