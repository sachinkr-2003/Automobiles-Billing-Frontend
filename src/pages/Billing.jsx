import { useState, useEffect } from 'react'
import { Plus, Search, Eye, X, CheckCircle, Pencil, Trash2, MessageCircle, Mail } from 'lucide-react'
import Select from 'react-select'
import CreatableSelect from 'react-select/creatable'
import { toPng, toJpeg } from 'html-to-image'
import jsPDF from 'jspdf'
import Swal from 'sweetalert2'
import emailjs from '@emailjs/browser'

const WhatsAppIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
)

const EMAILJS_SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const EMAILJS_PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

const statusStyle = {
  Paid:    'bg-green-100 text-green-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Unpaid:  'bg-red-100 text-red-700',
}

const empty = {
  customer: '',
  vehicle: '',
  amount: 0,
  status: 'Pending',
  paymentMethod: 'Unpaid',
  date: new Date().toISOString().split('T')[0],
}

export default function Billing() {
  const [bills, setBills]               = useState([])
  const [customers, setCustomers]       = useState([])
  const [vehicles, setVehicles]         = useState([])
  const [productsList, setProductsList] = useState([])

  const [filter, setFilter]         = useState('All')
  const [search, setSearch]         = useState('')
  const [showModal, setShowModal]   = useState(false)
  const [viewBill, setViewBill]     = useState(null)
  const [printBill, setPrintBill]   = useState(null)
  const [editingId, setEditingId]   = useState(null)

  const [form, setForm]                       = useState(empty)
  const [selectedParts, setSelectedParts]     = useState([])
  const [partSearch, setPartSearch]           = useState('')
  const [partPrice, setPartPrice]             = useState(0)
  const [qty, setQty]                         = useState(1)
  const [newCustomerName, setNewCustomerName] = useState('')

  // ─── Load Data ───────────────────────────────────────────────────────────────
  const loadData = () => {
    fetch(`${import.meta.env.VITE_API_URL}/bills`)
      .then(r => r.json())
      .then(data => {
        const mapped = data.map(b => ({
          id:            `INV-${b._id.slice(-6).toUpperCase()}`,
          _id:           b._id,
          customerId:    b.customer?._id,
          customer:      b.customer?.name       || 'Unknown',
          customerPhone: b.customer?.phone      || '',
          customerEmail: b.customer?.email      || '',
          vehicleId:     b.vehicle?._id,
          vehicle:       b.vehicle?.licensePlate || 'Unknown',
          service:       b.items.length + ' Items',
          parts:         b.items.map(i => i.itemName || i.service?.itemName || 'Unknown Item').join(', '),
          rawItems:      b.items,
          amount:        b.totalAmount,
          date:          new Date(b.date).toLocaleDateString(),
          status:        b.status,
          paymentMethod: b.paymentMethod,
        }))
        setBills(mapped)
      })
      .catch(console.error)

    fetch(`${import.meta.env.VITE_API_URL}/customers`).then(r => r.json()).then(setCustomers)
    fetch(`${import.meta.env.VITE_API_URL}/vehicles`).then(r => r.json()).then(setVehicles)
    fetch(`${import.meta.env.VITE_API_URL}/products`).then(r => r.json()).then(setProductsList)
  }

  useEffect(() => { loadData() }, [])

  const filtered = bills.filter(b => {
    const matchFilter = filter === 'All' || b.status === filter
    const matchSearch =
      b.customer.toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  // ─── Parts ───────────────────────────────────────────────────────────────────
  function handleAddPart() {
    if (!partSearch) return
    const part = productsList.find(p => p._id === partSearch)
    if (part) {
      setSelectedParts([...selectedParts, { ...part, quantity: qty, price: partPrice }])
      setForm({ ...form, amount: form.amount + partPrice * qty })
      setPartSearch('')
      setQty(1)
      setPartPrice(0)
    }
  }

  function removePart(index) {
    const part = selectedParts[index]
    setSelectedParts(selectedParts.filter((_, i) => i !== index))
    setForm({ ...form, amount: Math.max(0, form.amount - part.price * part.quantity) })
  }

  // ─── WhatsApp Click-to-Chat ───────────────────────────────────────────────────
  function openWhatsApp(bill) {
    const phone = (bill.customerPhone || '').replace(/[^0-9]/g, '')
    if (!phone) {
      Swal.fire({ title: 'No Phone Number', text: 'Is customer ka phone number database mein nahi hai.', icon: 'warning' })
      return
    }
    const indiaPhone = phone.startsWith('91') ? phone : `91${phone}`
    const items = bill.rawItems?.map((item, i) =>
      `${i + 1}. ${item.itemName || 'Item'} x${item.quantity} = ₹${(item.price * item.quantity).toLocaleString()}`
    ).join('\n') || ''

    const msg = encodeURIComponent(
      `🚗 *AutoBill Service Center* 🚗\n` +
      `------------------------------------\n` +
      `Hello *${bill.customer}*, 👋\n` +
      `Thank you for visiting us! Your invoice has been generated successfully.\n\n` +
      `📋 *INVOICE SUMMARY*\n` +
      `🔹 *Invoice No:* ${bill.id}\n` +
      `🔹 *Vehicle:* ${bill.vehicle}\n` +
      `🔹 *Date:* ${bill.date}\n\n` +
      `🔧 *SERVICES & PARTS*\n${items}\n` +
      `------------------------------------\n` +
      `💰 *GRAND TOTAL: ₹${bill.amount?.toLocaleString()}*\n` +
      `💳 *Payment Mode:* ${bill.paymentMethod || 'N/A'}\n` +
      `📊 *Status:* ${bill.status === 'Paid' ? '✅ Paid' : '⏳ ' + bill.status}\n` +
      `------------------------------------\n\n` +
      `🙏 We appreciate your business. Have a great day and drive safely! 🛣️✨`
    )
    window.open(`https://wa.me/${indiaPhone}?text=${msg}`, '_blank')
  }

  // ─── EmailJS ──────────────────────────────────────────────────────────────────
  async function sendEmail(bill) {
    let email = bill.customerEmail
    if (!email) {
      const { value: enteredEmail } = await Swal.fire({
        title: 'No Email Found',
        text: 'Is customer ka email database mein nahi hai. Naya email daalein:',
        input: 'email',
        inputPlaceholder: 'Enter customer email',
        showCancelButton: true,
        confirmButtonText: 'Save & Send',
      })
      
      if (!enteredEmail) return
      
      email = enteredEmail
      bill.customerEmail = enteredEmail // update local state
      
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/customers/${bill.customerId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: enteredEmail })
        })
      } catch (err) {
        console.error('Failed to update customer email:', err)
      }
    }

    if (!EMAILJS_SERVICE_ID || EMAILJS_SERVICE_ID === 'YOUR_SERVICE_ID') {
      Swal.fire({ title: 'EmailJS Setup Pending', text: '.env mein VITE_EMAILJS_SERVICE_ID, TEMPLATE_ID aur PUBLIC_KEY daalo.', icon: 'info' })
      return
    }

    const itemsHtml = bill.rawItems?.map((item, i) =>
      `${i + 1}. ${item.itemName || 'Item'} x${item.quantity} = ₹${(item.price * item.quantity).toLocaleString()}`
    ).join('\n') || ''

    try {
      Swal.fire({ title: 'Sending Email...', text: 'Please wait', icon: 'info', timer: 2000, showConfirmButton: false })
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          email:          email,
          to_email:       email,
          name:           bill.customer,
          to_name:        bill.customer,
          invoice_id:     bill.id,
          vehicle:        bill.vehicle,
          amount:         `₹${bill.amount?.toLocaleString()}`,
          date:           bill.date,
          status:         bill.status,
          payment_method: bill.paymentMethod || 'N/A',
          items_list:     itemsHtml,
        },
        EMAILJS_PUBLIC_KEY
      )
      Swal.fire({ title: 'Email Sent! 📧', text: `Invoice sent to ${email}`, icon: 'success', timer: 2500, showConfirmButton: false })
    } catch (err) {
      console.error('EmailJS Error:', err)
      const errorMessage = err?.text || err?.message || JSON.stringify(err) || 'Unknown error'
      Swal.fire({ title: 'Email Failed', text: `Error: ${errorMessage}`, icon: 'error' })
    }
  }

  // ─── Share Popup (after bill generate) ───────────────────────────────────────
  function showSharePopup(bill) {
    Swal.fire({
      title: '✅ Invoice Generated!',
      html: `
        <p class="text-gray-500 text-sm mb-1">PDF downloaded successfully.</p>
        <p class="text-gray-500 text-sm">Customer ko PDF share karna chahte ho?</p>
      `,
      icon: 'success',
      showCancelButton: true,
      confirmButtonText: '📤 Share PDF File',
      cancelButtonText: 'Skip',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#9ca3af',
    }).then(result => {
      if (result.isConfirmed) {
        // Since the element might not be rendered anymore if the popup is closed, 
        // we'll just temporarily set printBill again, but wait, the share API needs user interaction!
        // The safest way is to render a hidden element and get the blob.
        // We will call handleShareNative, but we need the HTML.
        // It's easier to just use the view element if we open the view modal, but let's just trigger it!
        // Actually, since we need to render the element, we can set viewBill and share it from there.
        setViewBill(bill)
      }
    })
  }

  // ─── Add / Edit Bill ──────────────────────────────────────────────────────────
  async function handleAdd(e) {
    e.preventDefault()

    let finalParts  = [...selectedParts]
    let finalAmount = form.amount

    if (partSearch) {
      const part = productsList.find(p => p._id === partSearch)
      if (part) {
        finalParts.push({ ...part, quantity: qty, price: partPrice })
        finalAmount += partPrice * qty
      }
    }

    if (finalParts.length === 0) {
      Swal.fire({ title: 'Error', text: 'Please add at least one item from the catalog', icon: 'warning' })
      return
    }

    let customerId = form.customer
    if (newCustomerName) {
      try {
        const res  = await fetch(`${import.meta.env.VITE_API_URL}/customers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newCustomerName, phone: '0000000000' }),
        })
        const data = await res.json()
        customerId = data._id
      } catch {
        Swal.fire({ title: 'Error', text: 'Failed to create new customer', icon: 'error' })
        return
      }
    }

    if (!customerId) {
      Swal.fire({ title: 'Error', text: 'Please select or type a customer', icon: 'error' })
      return
    }

    const url    = editingId ? `${import.meta.env.VITE_API_URL}/bills/${editingId}` : `${import.meta.env.VITE_API_URL}/bills`
    const method = editingId ? 'PUT' : 'POST'

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: customerId,
        vehicle:  form.vehicle ? form.vehicle : undefined,
        paymentMethod: form.paymentMethod,
        status:   form.paymentMethod === 'Unpaid' ? 'Pending' : 'Paid',
        items:    finalParts.map(p => ({
          service:  p._id || null,
          itemName: p.itemName,
          quantity: p.quantity,
          price:    p.price,
        })),
      }),
    })
      .then(async res => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Server error')
        return data
      })
      .then(data => {
        setForm(empty)
        setNewCustomerName('')
        setSelectedParts([])
        setPartSearch('')
        setPartPrice(0)
        setQty(1)
        setEditingId(null)
        setShowModal(false)
        loadData()

        const mapped = {
          id:            `INV-${data._id.slice(-6).toUpperCase()}`,
          _id:           data._id,
          customer:      data.customer?.name        || 'Unknown',
          customerPhone: data.customer?.phone       || '',
          customerEmail: data.customer?.email       || '',
          vehicle:       data.vehicle?.licensePlate || 'Unknown',
          rawItems:      data.items,
          amount:        data.totalAmount,
          date:          new Date(data.date).toLocaleDateString(),
          status:        data.status,
          paymentMethod: data.paymentMethod,
        }
        setPrintBill(mapped)
        Swal.fire({ title: 'Processing', text: 'Generating PDF...', icon: 'info', timer: 2000, showConfirmButton: false })
      })
      .catch(err => {
        console.error('Invoice Error:', err)
        Swal.fire({ title: 'Error', text: err.message || 'Failed to save invoice', icon: 'error' })
      })
  }

  // ─── Edit ─────────────────────────────────────────────────────────────────────
  const handleEdit = b => {
    setEditingId(b._id)
    setForm({
      customer:      b.customerId    || '',
      vehicle:       b.vehicleId     || '',
      amount:        b.amount,
      status:        b.status,
      paymentMethod: b.paymentMethod || 'Unpaid',
      date:          new Date().toISOString().split('T')[0],
    })
    if (b.rawItems?.length > 0) {
      setSelectedParts(b.rawItems.map(item => ({
        _id:      item.service?._id || null,
        itemName: item.itemName || item.service?.itemName || 'Unknown',
        price:    item.price,
        quantity: item.quantity,
      })))
    } else {
      setSelectedParts([])
    }
    setShowModal(true)
  }

  // ─── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = id => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    }).then(result => {
      if (result.isConfirmed) {
        fetch(`${import.meta.env.VITE_API_URL}/bills/${id}`, { method: 'DELETE' })
          .then(() => { Swal.fire('Deleted!', 'Invoice has been deleted.', 'success'); loadData() })
          .catch(() => Swal.fire('Error!', 'Failed to delete invoice.', 'error'))
      }
    })
  }

  // ─── Mark Paid ────────────────────────────────────────────────────────────────
  function markPaid(id) {
    fetch(`${import.meta.env.VITE_API_URL}/bills/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Paid' }),
    })
      .then(() => { Swal.fire({ title: 'Success', text: 'Bill marked as Paid', icon: 'success', timer: 1500, showConfirmButton: false }); loadData() })
      .catch(err => { console.error(err); Swal.fire({ title: 'Error', text: 'Failed to update status', icon: 'error' }) })
  }

  // ─── PDF ──────────────────────────────────────────────────────────────────────
  const generatePDFFromElement = (sourceId, filename, returnBlob = false) => {
    return new Promise((resolve, reject) => {
      const sourceElement = document.getElementById(sourceId)
      if (!sourceElement) return reject(new Error('Layout element not found'))

      const clone = sourceElement.cloneNode(true)
      clone.style.position   = 'fixed'
      clone.style.top        = '0px'
      clone.style.left       = '0px'
      clone.style.width      = '800px'
      clone.style.zIndex     = '-9999'
      clone.style.background = '#ffffff'
      document.body.appendChild(clone)

      setTimeout(() => {
        // Use JPEG compression to reduce PDF file size drastically for EmailJS
        toJpeg(clone, { cacheBust: true, pixelRatio: 1.5, backgroundColor: '#ffffff', quality: 0.8 })
          .then(imgData => {
            document.body.removeChild(clone)
            const img = new Image()
            img.src = imgData
            img.onload = () => {
              const pdf      = new jsPDF('p', 'mm', 'a4')
              const pdfWidth = pdf.internal.pageSize.getWidth()
              const pdfHeight = (img.height * pdfWidth) / img.width
              pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)
              
              if (returnBlob) {
                resolve(pdf.output('blob'))
              } else {
                pdf.save(filename)
                resolve()
              }
            }
          })
          .catch(err => { document.body.removeChild(clone); reject(new Error('Image render failed: ' + err.message)) })
      }, 500)
    })
  }

  // ─── Native File Share (Direct PDF on WhatsApp/Email) ─────────────────────────
  const handleShareNative = async (bill, sourceId) => {
    try {
      Swal.fire({ title: 'Preparing PDF...', text: 'Please wait...', icon: 'info', showConfirmButton: false })
      
      const blob = await generatePDFFromElement(sourceId, `Invoice_${bill.id}.pdf`, true)
      const file = new File([blob], `Invoice_${bill.id}.pdf`, { type: 'application/pdf' })

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        Swal.close()
        await navigator.share({
          files: [file],
          title: `Invoice ${bill.id}`,
          text: `Hello ${bill.customer}, here is your invoice.`,
        })
      } else {
        Swal.fire({ 
          title: 'Direct Share Not Supported', 
          text: 'Aapka browser direct file share support nahi karta. PDF download ho jayega, aap ise manually WhatsApp/Email par attach kar sakte hain.', 
          icon: 'warning' 
        })
        generatePDFFromElement(sourceId, `Invoice_${bill.id}.pdf`)
      }
    } catch (err) {
      console.error('Share Error:', err)
      Swal.fire({ title: 'Error', text: err.message, icon: 'error' })
    }
  }

  // Auto PDF download after bill creation
  useEffect(() => {
    if (!printBill) return
    setTimeout(() => {
      generatePDFFromElement('print-invoice-receipt', `Invoice_${printBill.id}.pdf`)
        .then(() => { showSharePopup(printBill); setPrintBill(null) })
        .catch(err => { console.error('Auto Download Error:', err); Swal.fire({ title: 'Error', text: err.message, icon: 'error' }) })
    }, 500)
  }, [printBill])

  const handleDownloadPdf = () => {
    Swal.fire({ title: 'Processing', text: 'Generating PDF...', icon: 'info', timer: 2000, showConfirmButton: false })
    generatePDFFromElement('view-invoice-receipt', `Invoice_${viewBill.id}.pdf`)
      .then(() => Swal.fire({ title: 'Success', text: 'Invoice downloaded successfully', icon: 'success', timer: 1500, showConfirmButton: false }))
      .catch(err => { console.error('Manual Download Error:', err); Swal.fire({ title: 'Error', text: err.message, icon: 'error' }) })
  }

  // ─── Invoice Template ─────────────────────────────────────────────────────────
  const renderInvoiceTemplate = (bill, idStr) => (
    <div id={idStr} className="bg-white px-10 pt-2 pb-4 flex flex-col mx-auto font-sans" style={{ width: '800px' }}>
      <div className="flex justify-between items-center mb-2 px-4">
        <div className="flex items-center gap-3">
          <div className="border-[3px] border-black p-1.5 rounded-sm rotate-45">
            <div className="-rotate-45"><CheckCircle size={24} className="text-black" /></div>
          </div>
          <div>
            <h1 className="text-[28px] font-black text-gray-900 leading-none tracking-tight">AutoBill</h1>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mt-1">Premium Service</p>
          </div>
        </div>
      </div>

      <div className="flex items-center w-full mb-3">
        <div className="h-6 bg-[#FFC107] flex-grow"></div>
        <h1 className="text-[32px] font-light text-[#2D3035] px-4 tracking-[0.15em] leading-none">INVOICE</h1>
        <div className="h-6 bg-[#FFC107] w-12"></div>
      </div>

      <div className="flex justify-between items-start mb-3 px-4">
        <div>
          <h3 className="font-bold text-gray-800 text-[15px] mb-1">Invoice to:</h3>
          <h2 className="text-[17px] font-bold text-gray-900">{bill.customer}</h2>
          <p className="text-[11px] text-gray-600 mt-1 max-w-[200px] leading-relaxed">
            Vehicle: {bill.vehicle}<br />
            {bill.customerPhone && <>Phone: {bill.customerPhone}<br /></>}
            {bill.customerEmail && <>Email: {bill.customerEmail}</>}
          </p>
        </div>
        <div className="w-64 text-[13px] pt-1">
          <div className="flex justify-between mb-2">
            <span className="font-bold text-gray-800">Invoice#</span>
            <span className="font-medium text-gray-600">{bill.id.replace('INV-', '')}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-gray-800">Date</span>
            <span className="font-medium text-gray-600">{bill.date}</span>
          </div>
        </div>
      </div>

      <div className="px-4 flex flex-col mb-6">
        <div className="border border-gray-200 rounded-sm overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-[#2D3035] text-white">
              <tr>
                <th className="py-2.5 px-4 text-left w-12 font-semibold text-[11px]">SL.</th>
                <th className="py-2.5 px-4 text-left font-semibold text-[11px]">Item Description</th>
                <th className="py-2.5 px-4 text-center font-semibold text-[11px]">Price</th>
                <th className="py-2.5 px-4 text-center font-semibold text-[11px]">Qty.</th>
                <th className="py-2.5 px-4 text-right font-semibold text-[11px]">Total</th>
              </tr>
            </thead>
            <tbody>
              {bill.rawItems?.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-200 bg-white">
                  <td className="py-3.5 px-4 text-gray-800 text-[11px] font-bold">{idx + 1}</td>
                  <td className="py-3.5 px-4 text-gray-800 text-[11px] font-bold">{item.itemName || item.service?.itemName || 'Unknown Item'}</td>
                  <td className="py-3.5 px-4 text-center text-gray-600 text-[11px] font-semibold">₹{item.price.toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-center text-gray-600 text-[11px] font-semibold">{item.quantity}</td>
                  <td className="py-3.5 px-4 text-right text-gray-600 text-[11px] font-semibold">₹{(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-start mt-2 px-4">
        <div className="w-1/2 pr-8">
          <p className="text-[13px] font-bold text-gray-800 mb-5">Thank you for your business</p>
          <div className="mb-5">
            <h4 className="font-bold text-gray-800 text-[11px] mb-1">Terms & Conditions</h4>
            <p className="text-[9px] text-gray-500 leading-relaxed pr-10">All parts remain our property until paid in full. No returns on electrical goods.</p>
          </div>
          <div>
            <h4 className="font-bold text-gray-800 text-[11px] mb-2">Payment Info:</h4>
            <table className="text-[9px] text-gray-500 w-full">
              <tbody>
                <tr><td className="font-bold text-gray-600 w-20 pb-1">Status:</td><td className="pb-1 text-gray-800 font-semibold">{bill.status}</td></tr>
                <tr><td className="font-bold text-gray-600 pb-1">Method:</td><td className="pb-1 text-gray-800 font-semibold">{bill.paymentMethod || 'N/A'}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="w-[45%]">
          <div className="flex justify-between text-[11px] font-bold text-gray-800 mb-2.5 px-6">
            <span>Sub Total:</span><span>₹{bill.amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[11px] font-bold text-gray-800 mb-4 px-6">
            <span>Tax:</span><span>0.00%</span>
          </div>
          <div className="flex justify-between py-2.5 px-6 bg-[#FFC107] font-bold text-gray-900 text-[13px] mt-6">
            <span>Total:</span><span>₹{bill.amount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 px-4 mb-2">
        <div className="flex justify-between items-end mt-12">
          <div className="flex gap-4 text-[10px] font-bold text-gray-800 border-t-[2px] border-[#FFC107] pt-3 w-[55%]">
            <span>Phone #</span><span className="text-gray-300">|</span>
            <span>Address</span><span className="text-gray-300">|</span>
            <span>Website</span>
          </div>
          <div className="text-center w-[30%]">
            <div className="border-b border-gray-400 w-full mb-2"></div>
            <span className="font-bold text-[10px] text-gray-800">Authorised Sign</span>
          </div>
        </div>
      </div>
    </div>
  )

  // ─── UI ───────────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-7 flex flex-col gap-4 md:gap-6">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {['All', 'Paid', 'Pending', 'Unpaid'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-sm text-sm font-semibold border transition-all cursor-pointer
                ${filter === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by name or ID..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-gray-200 rounded-sm pl-9 pr-3 py-1.5 text-sm outline-none focus:border-blue-400 w-full sm:w-56" />
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-1.5 rounded-sm transition-colors cursor-pointer">
            <Plus size={16} /> New Invoice
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Invoice ID', 'Customer', 'Vehicle', 'Items', 'Details', 'Total Amount', 'Date', 'Status', 'Action'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400">No bills found.</td></tr>
              ) : filtered.map(bill => (
                <tr key={bill.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-blue-600">{bill.id}</td>
                  <td className="py-3 px-4 text-gray-700">{bill.customer}</td>
                  <td className="py-3 px-4 text-gray-500">{bill.vehicle}</td>
                  <td className="py-3 px-4 text-gray-700">{bill.service}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs truncate max-w-[200px]">{bill.parts || '-'}</td>
                  <td className="py-3 px-4 font-bold text-gray-800">₹{bill.amount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-gray-500">{bill.date}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded text-xs font-semibold ${statusStyle[bill.status] || statusStyle.Pending}`}>{bill.status}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setViewBill(bill)} className="text-gray-400 hover:text-blue-600 transition-colors cursor-pointer" title="View Invoice">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => openWhatsApp(bill)} className="text-gray-400 hover:text-green-500 transition-colors cursor-pointer" title="Send on WhatsApp">
                        <WhatsAppIcon size={16} />
                      </button>
                      <button onClick={() => sendEmail(bill)} className="text-gray-400 hover:text-indigo-500 transition-colors cursor-pointer" title="Send Email">
                        <Mail size={16} />
                      </button>
                      <button onClick={() => handleEdit(bill)} className="text-gray-400 hover:text-blue-600 transition-colors cursor-pointer" title="Edit">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(bill._id)} className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer" title="Delete">
                        <Trash2 size={16} />
                      </button>
                      {bill.status === 'Pending' && (
                        <button onClick={() => markPaid(bill._id)} className="text-green-500 hover:text-green-700 transition-colors cursor-pointer" title="Mark Paid">
                          <CheckCircle size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm p-6 w-full max-w-lg shadow max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-800 mb-4">{editingId ? 'Edit Invoice' : 'Create New Invoice'}</h2>
            <form onSubmit={handleAdd} className="flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Customer Name</label>
                  <CreatableSelect
                    options={customers.map(c => ({ value: c._id, label: c.name }))}
                    value={form.customer
                      ? { value: form.customer, label: customers.find(c => c._id === form.customer)?.name }
                      : (newCustomerName ? { value: newCustomerName, label: newCustomerName } : null)}
                    onChange={opt => {
                      if (opt?.__isNew__) { setNewCustomerName(opt.value); setForm({ ...form, customer: '', vehicle: '' }) }
                      else { setNewCustomerName(''); setForm({ ...form, customer: opt ? opt.value : '', vehicle: '' }) }
                    }}
                    placeholder="Select or type new..."
                    isClearable
                    className="text-sm"
                    styles={{ control: base => ({ ...base, borderColor: '#e5e7eb', borderRadius: '0.125rem' }) }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Vehicle</label>
                  <Select
                    options={vehicles.filter(v => v.customer?._id === form.customer).map(v => ({ value: v._id, label: `${v.licensePlate} (${v.make})` }))}
                    value={form.vehicle ? { value: form.vehicle, label: vehicles.find(v => v._id === form.vehicle)?.licensePlate } : null}
                    onChange={opt => setForm({ ...form, vehicle: opt ? opt.value : '' })}
                    isDisabled={!form.customer}
                    placeholder="Select vehicle..."
                    isClearable
                    className="text-sm"
                    styles={{ control: base => ({ ...base, borderColor: '#e5e7eb', borderRadius: '0.125rem' }) }}
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-sm border border-gray-200 mt-2">
                <label className="text-xs font-bold text-gray-700 mb-2 block">Add Service / Part from Catalog</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <Select
                      options={productsList.map(p => ({ value: p._id, label: `${p.itemName} - ₹${p.price}` }))}
                      value={partSearch ? { value: partSearch, label: `${productsList.find(p => p._id === partSearch)?.itemName} - ₹${productsList.find(p => p._id === partSearch)?.price}` } : null}
                      onChange={opt => {
                        setPartSearch(opt ? opt.value : '')
                        if (opt) { const p = productsList.find(x => x._id === opt.value); setPartPrice(p ? p.price : 0) }
                        else setPartPrice(0)
                      }}
                      placeholder="Type to search catalog..."
                      isClearable
                      className="text-sm"
                      styles={{ control: base => ({ ...base, borderColor: '#e5e7eb', borderRadius: '0.125rem' }) }}
                    />
                  </div>
                  <input type="number" min="0" value={partPrice} onChange={e => setPartPrice(Number(e.target.value))}
                    className="w-20 border border-gray-300 rounded-sm px-2 py-1.5 text-sm outline-none focus:border-blue-400" title="Rate (₹)" />
                  <input type="number" min="1" value={qty} onChange={e => setQty(Number(e.target.value))}
                    className="w-16 border border-gray-300 rounded-sm px-2 py-1.5 text-sm outline-none focus:border-blue-400" title="Quantity" />
                  <button type="button" onClick={handleAddPart}
                    className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-sm text-sm font-semibold transition-colors cursor-pointer">
                    Add
                  </button>
                </div>
                {selectedParts.length > 0 && (
                  <div className="mt-3 flex flex-col gap-1.5">
                    {selectedParts.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white border border-gray-200 p-2 rounded-sm text-sm">
                        <span className="font-semibold text-gray-700">{p.itemName} x{p.quantity}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-blue-600 font-bold">₹{p.price * p.quantity}</span>
                          <button type="button" onClick={() => removePart(idx)} className="text-red-500 hover:text-red-700 cursor-pointer"><X size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="w-1/2 pr-3">
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Payment Method</label>
                  <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
                    className="w-full border border-gray-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white">
                    <option value="Unpaid">Unpaid (Pending)</option>
                    <option value="Cash">Cash (Paid)</option>
                    <option value="Online">Online (Paid)</option>
                  </select>
                </div>
                <div className="w-1/2 flex items-center justify-between bg-blue-50 text-blue-800 p-3 rounded-sm border border-blue-200 font-bold text-lg">
                  <span>Grand Total:</span>
                  <span>₹{form.amount.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-3 mt-3">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-sm transition-colors cursor-pointer">
                  {editingId ? 'Save Changes' : 'Generate Invoice'}
                </button>
                <button type="button"
                  onClick={() => { setShowModal(false); setEditingId(null); setForm(empty); setSelectedParts([]); setNewCustomerName('') }}
                  className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2 rounded-sm hover:bg-gray-50 cursor-pointer">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Bill Modal */}
      {viewBill && (
        <div className="fixed inset-0 bg-gray-500/50 flex justify-center items-start z-50 p-4 sm:p-8 overflow-y-auto">
          <div className="w-max shadow-xl relative mt-10 mb-10 bg-white shrink-0">
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <button onClick={() => handleShareNative(viewBill, 'view-invoice-receipt')}
                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-sm text-sm font-semibold transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                Share PDF (WhatsApp/Email)
              </button>
              <button onClick={handleDownloadPdf}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-sm text-sm font-semibold transition-colors">
                Download PDF
              </button>
              <button onClick={() => setViewBill(null)} className="text-gray-400 hover:text-red-500 cursor-pointer bg-white p-1 rounded-full shadow-sm">
                <X size={24} />
              </button>
            </div>
            {renderInvoiceTemplate(viewBill, 'view-invoice-receipt')}
          </div>
        </div>
      )}

      {/* Hidden PDF render containers */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        {printBill && renderInvoiceTemplate(printBill, 'print-invoice-receipt')}
      </div>
    </div>
  )
}
