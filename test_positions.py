import json
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from io import BytesIO

def create_position_test_pdf(input_pdf_path, output_pdf_path):
    """Create a test PDF with multiple position options"""
    print(f"🔧 Creating position test overlay...")
    
    # Create overlay PDF with multiple test boxes
    packet = BytesIO()
    can = canvas.Canvas(packet, pagesize=letter)
    
    # Get page dimensions
    page_width, page_height = letter  # 612, 792 points
    
    # Test positions - create numbered boxes in different locations
    test_positions = [
        {"x": 350, "y": 150, "label": "1"},
        {"x": 400, "y": 150, "label": "2"}, 
        {"x": 450, "y": 150, "label": "3"},
        {"x": 350, "y": 200, "label": "4"},
        {"x": 400, "y": 200, "label": "5"},
        {"x": 450, "y": 200, "label": "6"},
        {"x": 350, "y": 250, "label": "7"},
        {"x": 400, "y": 250, "label": "8"},
        {"x": 450, "y": 250, "label": "9"},
    ]
    
    for pos in test_positions:
        # Draw small colored box with number
        if int(pos["label"]) <= 3:
            can.setFillColorRGB(1, 0, 0)  # Red for bottom row
        elif int(pos["label"]) <= 6:
            can.setFillColorRGB(0, 1, 0)  # Green for middle row
        else:
            can.setFillColorRGB(0, 0, 1)  # Blue for top row
            
        can.setStrokeColorRGB(0, 0, 0)  # Black border
        can.setLineWidth(2)
        can.rect(pos["x"], pos["y"], 50, 30, fill=1, stroke=1)
        
        # Add number label
        can.setFillColorRGB(1, 1, 1)  # White text
        can.setFont("Helvetica-Bold", 14)
        can.drawString(pos["x"] + 20, pos["y"] + 8, pos["label"])
    
    can.save()
    packet.seek(0)
    print(f"✅ Test overlay PDF created")

    try:
        # Load original PDF
        print(f"📖 Reading original PDF: {input_pdf_path}")
        reader = PdfReader(input_pdf_path)
        writer = PdfWriter()
        overlay = PdfReader(packet)

        # Merge overlay onto first page
        page = reader.pages[0]
        overlay_page = overlay.pages[0]
        
        print(f"🔀 Merging test positions onto page")
        page.merge_page(overlay_page)
        writer.add_page(page)

        # Add remaining pages
        for i, p in enumerate(reader.pages):
            if i != 0:
                writer.add_page(p)

        # Save new PDF
        print(f"💾 Saving test PDF to: {output_pdf_path}")
        with open(output_pdf_path, "wb") as f:
            writer.write(f)
        
        print(f"✅ Position test PDF created!")
        print(f"📍 Red boxes (1-3): Y=150")
        print(f"📍 Green boxes (4-6): Y=200") 
        print(f"📍 Blue boxes (7-9): Y=250")
        print(f"📍 X positions: 350, 400, 450")
        
    except Exception as e:
        print(f"❌ Error creating test PDF: {str(e)}")
        raise

if __name__ == "__main__":
    # Test with the latest uploaded bill
    input_file = "uploads/024589e1-3cf7-4229-93c3-25d4bbc1792b.pdf"
    output_file = "uploads/position_test.pdf"
    create_position_test_pdf(input_file, output_file)