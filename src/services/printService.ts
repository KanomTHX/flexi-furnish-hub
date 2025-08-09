// Print Service for Warehouse Stock System

import { 
  PrintJob, 
  PrintDocumentType, 
  PrintStatus, 
  ReceiveDocumentPrintData,
  TransferDocumentPrintData,
  SNStickerPrintData,
  ClaimDocumentPrintData,
  StockReportPrintData,
  PrintConfig,
  PrintPreviewData,
  PrintError,
  StickerSize
} from '../types/printing';

class PrintService {
  private config: PrintConfig = {
    stickerSize: StickerSize.SMALL,
    documentMargins: { top: 20, right: 20, bottom: 20, left: 20 },
    stickerMargins: { top: 2, right: 2, bottom: 2, left: 2 },
    fontSize: { small: 8, normal: 10, large: 12 },
    includeQRCode: true,
    includeBarcode: true
  };

  private jobs: Map<string, PrintJob> = new Map();

  // Generate unique print job ID
  private generateJobId(): string {
    return `print_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get current timestamp
  private getCurrentTimestamp(): Date {
    return new Date();
  }

  // Create print job
  private createPrintJob(
    type: PrintDocumentType,
    documentData: any,
    copies: number = 1,
    userId: string,
    userName?: string
  ): PrintJob {
    const job: PrintJob = {
      id: this.generateJobId(),
      type,
      status: PrintStatus.PENDING,
      documentData,
      templateName: this.getTemplateName(type),
      copies,
      createdAt: this.getCurrentTimestamp(),
      userId,
      userName
    };

    this.jobs.set(job.id, job);
    return job;
  }

  // Get template name based on document type
  private getTemplateName(type: PrintDocumentType): string {
    const templates = {
      [PrintDocumentType.RECEIVE_DOCUMENT]: 'receive-document',
      [PrintDocumentType.TRANSFER_DOCUMENT]: 'transfer-document',
      [PrintDocumentType.SN_STICKER]: 'sn-sticker',
      [PrintDocumentType.CLAIM_DOCUMENT]: 'claim-document',
      [PrintDocumentType.STOCK_REPORT]: 'stock-report'
    };
    return templates[type];
  }

  // Generate HTML template for receive document
  private generateReceiveDocumentHTML(data: ReceiveDocumentPrintData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>ใบรับสินค้า - ${data.receiveNumber}</title>
        <style>
          ${this.getDocumentStyles()}
        </style>
      </head>
      <body>
        <div class="document">
          <div class="header">
            ${data.companyInfo.logo ? `<img src="${data.companyInfo.logo}" alt="Logo" class="logo">` : ''}
            <div class="company-info">
              <h1>${data.companyInfo.name}</h1>
              <p>${data.companyInfo.address}</p>
              <p>โทร: ${data.companyInfo.phone} | อีเมล: ${data.companyInfo.email}</p>
            </div>
          </div>
          
          <div class="document-title">
            <h2>ใบรับสินค้า</h2>
            <p>เลขที่: ${data.receiveNumber}</p>
          </div>
          
          <div class="document-info">
            <div class="info-section">
              <h3>ข้อมูลการรับสินค้า</h3>
              <p><strong>วันที่รับ:</strong> ${this.formatDate(data.receiveDate)}</p>
              <p><strong>คลังสินค้า:</strong> ${data.warehouse.name} (${data.warehouse.code})</p>
              <p><strong>ผู้รับสินค้า:</strong> ${data.receivedBy}</p>
              ${data.invoiceNumber ? `<p><strong>เลขที่ใบวางบิล:</strong> ${data.invoiceNumber}</p>` : ''}
            </div>
            
            ${data.supplier ? `
            <div class="info-section">
              <h3>ข้อมูลผู้จำหน่าย</h3>
              <p><strong>ชื่อ:</strong> ${data.supplier.name}</p>
              <p><strong>รหัส:</strong> ${data.supplier.code}</p>
              ${data.supplier.phone ? `<p><strong>โทร:</strong> ${data.supplier.phone}</p>` : ''}
            </div>
            ` : ''}
          </div>
          
          <div class="items-table">
            <table>
              <thead>
                <tr>
                  <th>ลำดับ</th>
                  <th>รายการสินค้า</th>
                  <th>รหัสสินค้า</th>
                  <th>แบรนด์/รุ่น</th>
                  <th>จำนวน</th>
                  <th>ราคาต่อหน่วย</th>
                  <th>รวม</th>
                  <th>Serial Numbers</th>
                </tr>
              </thead>
              <tbody>
                ${data.items.map((item, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.productName}</td>
                    <td>${item.productCode}</td>
                    <td>${item.brand || ''} ${item.model || ''}</td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">${this.formatCurrency(item.unitCost)}</td>
                    <td class="text-right">${this.formatCurrency(item.totalCost)}</td>
                    <td class="serial-numbers">${item.serialNumbers.join(', ')}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="4"><strong>รวมทั้งสิ้น</strong></td>
                  <td class="text-center"><strong>${data.totalItems}</strong></td>
                  <td></td>
                  <td class="text-right"><strong>${this.formatCurrency(data.totalCost)}</strong></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          ${data.notes ? `
          <div class="notes">
            <h3>หมายเหตุ</h3>
            <p>${data.notes}</p>
          </div>
          ` : ''}
          
          <div class="signatures">
            <div class="signature-box">
              <p>ลงชื่อ ผู้รับสินค้า</p>
              <div class="signature-line"></div>
              <p>(${data.receivedBy})</p>
              <p>วันที่: ${this.formatDate(data.receiveDate)}</p>
            </div>
            
            <div class="signature-box">
              <p>ลงชื่อ ผู้ส่งสินค้า</p>
              <div class="signature-line"></div>
              <p>(...........................)</p>
              <p>วันที่: .........................</p>
            </div>
          </div>
          
          <div class="footer">
            <p>พิมพ์เมื่อ: ${this.formatDateTime(new Date())}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate HTML template for transfer document
  private generateTransferDocumentHTML(data: TransferDocumentPrintData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>ใบโอนสินค้า - ${data.transferNumber}</title>
        <style>
          ${this.getDocumentStyles()}
        </style>
      </head>
      <body>
        <div class="document">
          <div class="header">
            ${data.companyInfo.logo ? `<img src="${data.companyInfo.logo}" alt="Logo" class="logo">` : ''}
            <div class="company-info">
              <h1>${data.companyInfo.name}</h1>
              <p>${data.companyInfo.address}</p>
              <p>โทร: ${data.companyInfo.phone} | อีเมล: ${data.companyInfo.email}</p>
            </div>
          </div>
          
          <div class="document-title">
            <h2>ใบโอนสินค้า</h2>
            <p>เลขที่: ${data.transferNumber}</p>
            <p>สถานะ: ${data.status}</p>
          </div>
          
          <div class="document-info">
            <div class="info-section">
              <h3>คลังต้นทาง</h3>
              <p><strong>ชื่อ:</strong> ${data.sourceWarehouse.name}</p>
              <p><strong>รหัส:</strong> ${data.sourceWarehouse.code}</p>
              ${data.sourceWarehouse.address ? `<p><strong>ที่อยู่:</strong> ${data.sourceWarehouse.address}</p>` : ''}
            </div>
            
            <div class="info-section">
              <h3>คลังปลายทาง</h3>
              <p><strong>ชื่อ:</strong> ${data.targetWarehouse.name}</p>
              <p><strong>รหัส:</strong> ${data.targetWarehouse.code}</p>
              ${data.targetWarehouse.address ? `<p><strong>ที่อยู่:</strong> ${data.targetWarehouse.address}</p>` : ''}
            </div>
          </div>
          
          <div class="transfer-info">
            <p><strong>วันที่โอน:</strong> ${this.formatDate(data.transferDate)}</p>
            <p><strong>ผู้ดำเนินการ:</strong> ${data.initiatedBy}</p>
            ${data.confirmedBy ? `<p><strong>ผู้ยืนยัน:</strong> ${data.confirmedBy}</p>` : ''}
          </div>
          
          <div class="items-table">
            <table>
              <thead>
                <tr>
                  <th>ลำดับ</th>
                  <th>รายการสินค้า</th>
                  <th>รหัสสินค้า</th>
                  <th>แบรนด์/รุ่น</th>
                  <th>Serial Number</th>
                  <th>ราคาต่อหน่วย</th>
                </tr>
              </thead>
              <tbody>
                ${data.items.map((item, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.productName}</td>
                    <td>${item.productCode}</td>
                    <td>${item.brand || ''} ${item.model || ''}</td>
                    <td class="serial-number">${item.serialNumber}</td>
                    <td class="text-right">${this.formatCurrency(item.unitCost)}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="4"><strong>รวมทั้งสิ้น</strong></td>
                  <td class="text-center"><strong>${data.totalItems} รายการ</strong></td>
                  <td class="text-right"><strong>${this.formatCurrency(data.totalValue)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          ${data.notes ? `
          <div class="notes">
            <h3>หมายเหตุ</h3>
            <p>${data.notes}</p>
          </div>
          ` : ''}
          
          <div class="signatures">
            <div class="signature-box">
              <p>ลงชื่อ ผู้ส่ง</p>
              <div class="signature-line"></div>
              <p>(${data.initiatedBy})</p>
              <p>วันที่: ${this.formatDate(data.transferDate)}</p>
            </div>
            
            <div class="signature-box">
              <p>ลงชื่อ ผู้รับ</p>
              <div class="signature-line"></div>
              <p>${data.confirmedBy ? `(${data.confirmedBy})` : '(...........................)'}</p>
              <p>วันที่: .........................</p>
            </div>
          </div>
          
          <div class="footer">
            <p>พิมพ์เมื่อ: ${this.formatDateTime(new Date())}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate HTML template for SN sticker
  private generateSNStickerHTML(data: SNStickerPrintData): string {
    const stickerWidth = this.config.stickerSize === StickerSize.SMALL ? '3.2cm' : 
                        this.config.stickerSize === StickerSize.MEDIUM ? '5cm' : '7cm';
    const stickerHeight = this.config.stickerSize === StickerSize.SMALL ? '2.5cm' : 
                         this.config.stickerSize === StickerSize.MEDIUM ? '3cm' : '5cm';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>SN Sticker - ${data.serialNumber}</title>
        <style>
          ${this.getStickerStyles(stickerWidth, stickerHeight)}
        </style>
      </head>
      <body>
        <div class="sticker">
          <div class="sn-header">
            <div class="sn-number">${data.serialNumber}</div>
          </div>
          
          <div class="product-info">
            <div class="product-name">${this.truncateText(data.productName, 20)}</div>
            <div class="product-code">${data.productCode}</div>
            ${data.brand ? `<div class="brand">${data.brand}</div>` : ''}
          </div>
          
          <div class="additional-info">
            <div class="cost">฿${this.formatCurrency(data.unitCost)}</div>
            <div class="date">${this.formatShortDate(data.receiveDate)}</div>
            <div class="warehouse">${this.truncateText(data.warehouseName, 10)}</div>
          </div>
          
          ${this.config.includeQRCode && data.qrCode ? `
          <div class="qr-code">
            <img src="${data.qrCode}" alt="QR Code">
          </div>
          ` : ''}
          
          ${this.config.includeBarcode && data.barcode ? `
          <div class="barcode">
            <img src="${data.barcode}" alt="Barcode">
          </div>
          ` : ''}
        </div>
      </body>
      </html>
    `;
  }

  // Generate HTML template for claim document
  private generateClaimDocumentHTML(data: ClaimDocumentPrintData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>ใบเคลม - ${data.claimNumber}</title>
        <style>
          ${this.getDocumentStyles()}
        </style>
      </head>
      <body>
        <div class="document">
          <div class="header">
            ${data.companyInfo.logo ? `<img src="${data.companyInfo.logo}" alt="Logo" class="logo">` : ''}
            <div class="company-info">
              <h1>${data.companyInfo.name}</h1>
              <p>${data.companyInfo.address}</p>
              <p>โทร: ${data.companyInfo.phone} | อีเมล: ${data.companyInfo.email}</p>
            </div>
          </div>
          
          <div class="document-title">
            <h2>ใบเคลมสินค้า</h2>
            <p>เลขที่: ${data.claimNumber}</p>
          </div>
          
          <div class="document-info">
            <div class="info-section">
              <h3>ข้อมูลการเคลม</h3>
              <p><strong>วันที่เคลม:</strong> ${this.formatDate(data.claimDate)}</p>
              <p><strong>ประเภทเคลม:</strong> ${data.claimType}</p>
              <p><strong>ผู้ดำเนินการ:</strong> ${data.processedBy}</p>
              <p><strong>คลังสินค้า:</strong> ${data.warehouse.name} (${data.warehouse.code})</p>
            </div>
            
            ${data.customerName ? `
            <div class="info-section">
              <h3>ข้อมูลลูกค้า</h3>
              <p><strong>ชื่อลูกค้า:</strong> ${data.customerName}</p>
              ${data.originalSaleReference ? `<p><strong>อ้างอิงการขาย:</strong> ${data.originalSaleReference}</p>` : ''}
            </div>
            ` : ''}
          </div>
          
          <div class="product-info">
            <h3>ข้อมูลสินค้า</h3>
            <table>
              <tr>
                <td><strong>Serial Number:</strong></td>
                <td>${data.serialNumber}</td>
              </tr>
              <tr>
                <td><strong>ชื่อสินค้า:</strong></td>
                <td>${data.productName}</td>
              </tr>
              <tr>
                <td><strong>รหัสสินค้า:</strong></td>
                <td>${data.productCode}</td>
              </tr>
              ${data.brand ? `
              <tr>
                <td><strong>แบรนด์:</strong></td>
                <td>${data.brand}</td>
              </tr>
              ` : ''}
              ${data.model ? `
              <tr>
                <td><strong>รุ่น:</strong></td>
                <td>${data.model}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <div class="claim-details">
            <h3>รายละเอียดการเคลม</h3>
            <p><strong>เหตุผล:</strong></p>
            <div class="reason-box">${data.reason}</div>
            
            ${data.resolution ? `
            <p><strong>การแก้ไข:</strong></p>
            <div class="resolution-box">${data.resolution}</div>
            ` : ''}
          </div>
          
          <div class="signatures">
            <div class="signature-box">
              <p>ลงชื่อ ผู้ดำเนินการ</p>
              <div class="signature-line"></div>
              <p>(${data.processedBy})</p>
              <p>วันที่: ${this.formatDate(data.claimDate)}</p>
            </div>
            
            ${data.customerName ? `
            <div class="signature-box">
              <p>ลงชื่อ ลูกค้า</p>
              <div class="signature-line"></div>
              <p>(${data.customerName})</p>
              <p>วันที่: .........................</p>
            </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <p>พิมพ์เมื่อ: ${this.formatDateTime(new Date())}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Get document styles
  private getDocumentStyles(): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Sarabun', 'TH SarabunPSK', Arial, sans-serif;
        font-size: ${this.config.fontSize.normal}pt;
        line-height: 1.4;
        color: #333;
      }
      
      .document {
        width: 210mm;
        min-height: 297mm;
        margin: 0 auto;
        padding: ${this.config.documentMargins.top}mm ${this.config.documentMargins.right}mm ${this.config.documentMargins.bottom}mm ${this.config.documentMargins.left}mm;
        background: white;
      }
      
      .header {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
        border-bottom: 2px solid #333;
        padding-bottom: 10px;
      }
      
      .logo {
        width: 60px;
        height: 60px;
        margin-right: 20px;
      }
      
      .company-info h1 {
        font-size: ${this.config.fontSize.large + 2}pt;
        margin-bottom: 5px;
      }
      
      .company-info p {
        font-size: ${this.config.fontSize.small}pt;
        margin-bottom: 2px;
      }
      
      .document-title {
        text-align: center;
        margin-bottom: 20px;
      }
      
      .document-title h2 {
        font-size: ${this.config.fontSize.large + 4}pt;
        margin-bottom: 10px;
      }
      
      .document-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20px;
      }
      
      .info-section {
        flex: 1;
        margin-right: 20px;
      }
      
      .info-section:last-child {
        margin-right: 0;
      }
      
      .info-section h3 {
        font-size: ${this.config.fontSize.normal + 1}pt;
        margin-bottom: 10px;
        border-bottom: 1px solid #ccc;
        padding-bottom: 5px;
      }
      
      .items-table {
        margin-bottom: 20px;
      }
      
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: ${this.config.fontSize.small}pt;
      }
      
      th, td {
        border: 1px solid #333;
        padding: 8px;
        text-align: left;
      }
      
      th {
        background-color: #f5f5f5;
        font-weight: bold;
        text-align: center;
      }
      
      .text-center {
        text-align: center;
      }
      
      .text-right {
        text-align: right;
      }
      
      .serial-numbers {
        font-size: ${this.config.fontSize.small - 1}pt;
        word-break: break-all;
      }
      
      .serial-number {
        font-family: monospace;
        font-weight: bold;
      }
      
      .total-row {
        background-color: #f9f9f9;
        font-weight: bold;
      }
      
      .notes {
        margin-bottom: 20px;
      }
      
      .notes h3 {
        margin-bottom: 10px;
      }
      
      .reason-box, .resolution-box {
        border: 1px solid #ccc;
        padding: 10px;
        margin-top: 5px;
        min-height: 60px;
        background-color: #f9f9f9;
      }
      
      .signatures {
        display: flex;
        justify-content: space-between;
        margin-top: 40px;
        margin-bottom: 20px;
      }
      
      .signature-box {
        text-align: center;
        width: 200px;
      }
      
      .signature-line {
        border-bottom: 1px solid #333;
        margin: 40px 0 10px 0;
      }
      
      .footer {
        text-align: center;
        font-size: ${this.config.fontSize.small}pt;
        color: #666;
        border-top: 1px solid #ccc;
        padding-top: 10px;
      }
      
      @media print {
        .document {
          margin: 0;
          box-shadow: none;
        }
        
        @page {
          margin: 0;
          size: A4;
        }
      }
    `;
  }

  // Get sticker styles
  private getStickerStyles(width: string, height: string): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Sarabun', 'TH SarabunPSK', Arial, sans-serif;
        font-size: ${this.config.fontSize.small}pt;
        line-height: 1.2;
      }
      
      .sticker {
        width: ${width};
        height: ${height};
        border: 1px solid #333;
        padding: ${this.config.stickerMargins.top}mm ${this.config.stickerMargins.right}mm ${this.config.stickerMargins.bottom}mm ${this.config.stickerMargins.left}mm;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        background: white;
      }
      
      .sn-header {
        text-align: center;
        border-bottom: 1px solid #333;
        padding-bottom: 1mm;
        margin-bottom: 1mm;
      }
      
      .sn-number {
        font-family: monospace;
        font-weight: bold;
        font-size: ${this.config.fontSize.small + 1}pt;
      }
      
      .product-info {
        flex: 1;
        text-align: center;
      }
      
      .product-name {
        font-weight: bold;
        font-size: ${this.config.fontSize.small}pt;
        margin-bottom: 1mm;
      }
      
      .product-code {
        font-size: ${this.config.fontSize.small - 1}pt;
        margin-bottom: 1mm;
      }
      
      .brand {
        font-size: ${this.config.fontSize.small - 1}pt;
        font-style: italic;
      }
      
      .additional-info {
        display: flex;
        justify-content: space-between;
        font-size: ${this.config.fontSize.small - 1}pt;
        border-top: 1px solid #ccc;
        padding-top: 1mm;
      }
      
      .cost {
        font-weight: bold;
      }
      
      .qr-code, .barcode {
        text-align: center;
        margin-top: 1mm;
      }
      
      .qr-code img, .barcode img {
        max-width: 100%;
        max-height: 8mm;
      }
      
      @media print {
        .sticker {
          margin: 0;
          box-shadow: none;
        }
        
        @page {
          margin: 0;
          size: ${width} ${height};
        }
      }
    `;
  }

  // Utility methods
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }

  private formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  private formatShortDate(date: Date): string {
    return new Intl.DateTimeFormat('th-TH', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    }).format(date);
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  // Public methods

  // Print receive document
  async printReceiveDocument(
    data: ReceiveDocumentPrintData,
    copies: number = 1,
    userId: string,
    userName?: string
  ): Promise<PrintJob> {
    try {
      const job = this.createPrintJob(
        PrintDocumentType.RECEIVE_DOCUMENT,
        data,
        copies,
        userId,
        userName
      );

      // Update job status to printing
      job.status = PrintStatus.PRINTING;
      this.jobs.set(job.id, job);

      // Generate HTML and print
      const html = this.generateReceiveDocumentHTML(data);
      await this.executePrint(html, copies);

      // Update job status to completed
      job.status = PrintStatus.COMPLETED;
      job.printedAt = this.getCurrentTimestamp();
      this.jobs.set(job.id, job);

      return job;
    } catch (error) {
      const job = this.jobs.get(this.generateJobId());
      if (job) {
        job.status = PrintStatus.FAILED;
        job.error = error instanceof Error ? error.message : 'Unknown error';
        this.jobs.set(job.id, job);
      }
      throw error;
    }
  }

  // Print transfer document
  async printTransferDocument(
    data: TransferDocumentPrintData,
    copies: number = 1,
    userId: string,
    userName?: string
  ): Promise<PrintJob> {
    try {
      const job = this.createPrintJob(
        PrintDocumentType.TRANSFER_DOCUMENT,
        data,
        copies,
        userId,
        userName
      );

      job.status = PrintStatus.PRINTING;
      this.jobs.set(job.id, job);

      const html = this.generateTransferDocumentHTML(data);
      await this.executePrint(html, copies);

      job.status = PrintStatus.COMPLETED;
      job.printedAt = this.getCurrentTimestamp();
      this.jobs.set(job.id, job);

      return job;
    } catch (error) {
      const job = this.jobs.get(this.generateJobId());
      if (job) {
        job.status = PrintStatus.FAILED;
        job.error = error instanceof Error ? error.message : 'Unknown error';
        this.jobs.set(job.id, job);
      }
      throw error;
    }
  }

  // Print SN stickers
  async printSNStickers(
    stickers: SNStickerPrintData[],
    userId: string,
    userName?: string
  ): Promise<PrintJob> {
    try {
      const job = this.createPrintJob(
        PrintDocumentType.SN_STICKER,
        stickers,
        stickers.length,
        userId,
        userName
      );

      job.status = PrintStatus.PRINTING;
      this.jobs.set(job.id, job);

      // Generate HTML for all stickers
      const htmlPages = stickers.map(sticker => this.generateSNStickerHTML(sticker));
      
      for (const html of htmlPages) {
        await this.executePrint(html, 1);
      }

      job.status = PrintStatus.COMPLETED;
      job.printedAt = this.getCurrentTimestamp();
      this.jobs.set(job.id, job);

      return job;
    } catch (error) {
      const job = this.jobs.get(this.generateJobId());
      if (job) {
        job.status = PrintStatus.FAILED;
        job.error = error instanceof Error ? error.message : 'Unknown error';
        this.jobs.set(job.id, job);
      }
      throw error;
    }
  }

  // Print claim document
  async printClaimDocument(
    data: ClaimDocumentPrintData,
    copies: number = 1,
    userId: string,
    userName?: string
  ): Promise<PrintJob> {
    try {
      const job = this.createPrintJob(
        PrintDocumentType.CLAIM_DOCUMENT,
        data,
        copies,
        userId,
        userName
      );

      job.status = PrintStatus.PRINTING;
      this.jobs.set(job.id, job);

      const html = this.generateClaimDocumentHTML(data);
      await this.executePrint(html, copies);

      job.status = PrintStatus.COMPLETED;
      job.printedAt = this.getCurrentTimestamp();
      this.jobs.set(job.id, job);

      return job;
    } catch (error) {
      const job = this.jobs.get(this.generateJobId());
      if (job) {
        job.status = PrintStatus.FAILED;
        job.error = error instanceof Error ? error.message : 'Unknown error';
        this.jobs.set(job.id, job);
      }
      throw error;
    }
  }

  // Generate print preview
  async generatePreview(
    type: PrintDocumentType,
    data: any
  ): Promise<PrintPreviewData> {
    let html = '';
    let css = '';

    switch (type) {
      case PrintDocumentType.RECEIVE_DOCUMENT:
        html = this.generateReceiveDocumentHTML(data);
        css = this.getDocumentStyles();
        break;
      case PrintDocumentType.TRANSFER_DOCUMENT:
        html = this.generateTransferDocumentHTML(data);
        css = this.getDocumentStyles();
        break;
      case PrintDocumentType.SN_STICKER:
        html = this.generateSNStickerHTML(data);
        css = this.getStickerStyles('3.2cm', '2.5cm');
        break;
      case PrintDocumentType.CLAIM_DOCUMENT:
        html = this.generateClaimDocumentHTML(data);
        css = this.getDocumentStyles();
        break;
      default:
        throw new Error(`Unsupported document type: ${type}`);
    }

    return {
      html,
      css,
      type,
      copies: 1,
      estimatedPages: 1
    };
  }

  // Execute print (browser print API)
  private async executePrint(html: string, copies: number): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          throw new Error('Unable to open print window');
        }

        printWindow.document.write(html);
        printWindow.document.close();

        // Wait for content to load
        printWindow.onload = () => {
          // Print the document
          printWindow.print();
          
          // Close the window after printing
          setTimeout(() => {
            printWindow.close();
            resolve();
          }, 1000);
        };

        // Handle print errors
        printWindow.onerror = (error) => {
          printWindow.close();
          reject(new Error(`Print error: ${error}`));
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  // Get print job status
  getPrintJob(jobId: string): PrintJob | undefined {
    return this.jobs.get(jobId);
  }

  // Get all print jobs
  getAllPrintJobs(): PrintJob[] {
    return Array.from(this.jobs.values());
  }

  // Cancel print job
  cancelPrintJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (job && job.status === PrintStatus.PENDING) {
      job.status = PrintStatus.CANCELLED;
      this.jobs.set(jobId, job);
      return true;
    }
    return false;
  }

  // Update print configuration
  updateConfig(config: Partial<PrintConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Get current configuration
  getConfig(): PrintConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const printService = new PrintService();
export default printService;