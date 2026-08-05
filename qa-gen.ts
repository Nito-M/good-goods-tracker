import jsPDF from 'jspdf';
import { generatePackingSlipPDF } from '/dev-server/src/lib/packingSlipGenerator';
(globalThis as any).navigator = { userAgent: 'node' };
const rows = Array.from({length: 14}, (_,i)=>({itemName: i%3===0? '20FT Flatbed Utility Trailer With Extra Long Description Name':'Cargo Trailer 7x14', vin: i%4===0? '': '2C9UT2028R1234'+i, stockNumber: 'STK-10'+i, jobNumber:'JOB-000'+i, quantity:1, unitPrice: 12345.5, totalPrice: 12345.5}));
const quote: any = { salesOrderNumber:'SO-0007', quoteNumber:'QUO-0021', vendorName:'Northern Outline Ltd.', contactPersonName:'John Smith', vendorAddress:'123 Main St\nEdmonton, AB T5A 1A1', createdAt:new Date().toISOString(), items:[] };
const settings: any = { businessName:'FM Fabrications', businessAddress:'55 Industrial Rd\nLeduc, AB', businessPhone:'780-555-1234', businessEmail:'sales@fmfab.ca', logoUrl:null, layout:null, thankYouNote:null };
let out: Buffer|null=null;
// patch savePdfBlob by writing manually: replicate by monkeypatch of jsPDF output
const origOutput = (jsPDF as any).prototype.output;
(jsPDF as any).prototype.output = function(t:string){ if(t==='blob'){ out = Buffer.from(origOutput.call(this,'arraybuffer')); return new Blob([]);} return origOutput.call(this,t); };
try{await generatePackingSlipPDF(quote, settings, { includePrices: true, rows });}catch(e){}
require('fs').writeFileSync('/tmp/qa/prices.pdf', out!);
try{await generatePackingSlipPDF(quote, settings, { includePrices: false, rows });}catch(e){}
require('fs').writeFileSync('/tmp/qa/noprices.pdf', out!);
console.log('ok');
