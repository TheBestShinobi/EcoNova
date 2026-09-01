import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { parseBank, parseReceiptImage, parseReceiptText } from '../api'

const ReasoningSection = ({ item }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  
  if (!item.reasoning) return null
  
  return (
    <div className="mt-1">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-xs text-cosmic-gray hover:text-cosmic-pinkLight transition-colors flex items-center gap-1"
      >
        <span>{isExpanded ? '▼' : '▶'}</span>
        <span>Why this classification?</span>
      </button>
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-1 text-xs text-cosmic-lavenderLight bg-cosmic-deep/30 p-2 rounded border border-cosmic-pink/10"
        >
          {item.reasoning}
        </motion.div>
      )}
    </div>
  )
}

const CarbonLogger = () => {
  const [activeMode, setActiveMode] = useState('transaction') // 'transaction' or 'receipt'
  const [transactionData, setTransactionData] = useState({
    transactionName: '',
    transactionAmount: '',
  })
  const [receiptFile, setReceiptFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    resetForm()
  }, [activeMode])

  const resetForm = () => {
    setSubmitted(false)
    setResult(null)
    setReceiptFile(null)
    setTransactionData({ transactionName: '', transactionAmount: '' })
  }

  const handleTransactionSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setResult(null)
    
    try {
      // Combine transaction info into text for parsing
      const transactionText = `Transaction: ${transactionData.transactionName}, Amount: ${transactionData.transactionAmount}`
      const response = await parseBank(transactionText)
      setResult(response)
      setSubmitted(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReceiptUpload = async (e) => {
    const file = e.target.files[0]
    if (file) {
      setReceiptFile(file)
      setIsSubmitting(true)
      setError(null)
      setResult(null)
      
      try {
        const response = await parseReceiptImage(file)
        setResult(response)
        setSubmitted(true)
      } catch (err) {
        setError(err.message)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto"
    >
      {/* Section Title */}
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="text-center mb-8"
      >
        <h2 className="text-4xl font-lobster text-cosmic-pink mb-2">
          Log Your Carbon
        </h2>
        <p className="text-cosmic-lavenderLight">
          Track your carbon footprint from transactions & receipts
        </p>
      </motion.div>

      {/* Mode Toggle */}
      <div className="flex justify-center mb-8">
        <div className="glass rounded-full p-1 flex">
          <button
            onClick={() => setActiveMode('transaction')}
            className={`px-6 py-3 rounded-full transition-all duration-300 ${
              activeMode === 'transaction'
                ? 'bg-cosmic-pink text-white'
                : 'text-cosmic-pinkLight hover:text-white'
            }`}
          >
            Transaction Info
          </button>
          <button
            onClick={() => setActiveMode('receipt')}
            className={`px-6 py-3 rounded-full transition-all duration-300 ${
              activeMode === 'receipt'
                ? 'bg-cosmic-pink text-white'
                : 'text-cosmic-pinkLight hover:text-white'
            }`}
          >
            Scan Receipt
          </button>
        </div>
      </div>

      {/* Success Message */}
      {submitted && result && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-6 text-center mb-6 border-2 border-cosmic-green"
        >
          <div className="text-4xl mb-2">✨</div>
          <p className="text-cosmic-green font-medium">
            {activeMode === 'transaction' ? 'Transaction logged successfully!' : 'Receipt scanned & processed!'}
          </p>

          {/* Category Summary */}
          {result.category_summary && (
            <div className="mt-4 text-left bg-cosmic-deep/50 p-4 rounded-lg">
              <h4 className="font-bold text-cosmic-pink">Category Breakdown:</h4>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {Object.entries(result.category_summary).map(([category, co2]) => (
                  <div key={category} className="flex justify-between text-sm">
                    <span className="text-cosmic-lavenderLight capitalize">{category}:</span>
                    <span className="text-white">{co2.toFixed(2)} kg</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-cosmic-lavenderLight text-sm mt-4 text-left bg-cosmic-deep/50 p-4 rounded-lg font-mono">
            <p>
              <span className="font-bold text-cosmic-pink">Total CO2:</span> {result.total_kg_co2} kg
            </p>
            <p>
              <span className="font-bold text-cosmic-pink">Rating:</span> {result.rating}
            </p>
            <h4 className="font-bold text-cosmic-pink mt-2">Items:</h4>
            <div>
              {result.items.map((item, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-white mt-1.5">•</span>
                  <div className="flex-1">
                    <div>
                      <span className="text-white">{item.description}</span>
                      <span className="text-cosmic-gray ml-2">{item.kg_co2} kg</span>
                      {item.sub_category && (
                        <span className="text-cosmic-gray text-xs ml-2">
                          ({item.category} › {item.sub_category})
                        </span>
                      )}
                      {item.confidence && (
                        <span className={`text-xs ml-2 ${
                          item.confidence === 'high' ? 'text-cosmic-green' :
                          item.confidence === 'medium' ? 'text-yellow-400' :
                        'text-red-400'
                        }`}>
                          {item.confidence}
                        </span>
                      )}
                    </div>
                    {item.reasoning && (
                      <ReasoningSection item={item} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <motion.button
            onClick={resetForm}
            whileHover={{ scale: 1.05 }}
            className="mt-4 px-6 py-2 rounded-full glass text-sm text-cosmic-pinkLight hover:bg-cosmic-pink/20 transition-colors"
          >
            Log Another
          </motion.button>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-6 text-center mb-6 border-2 border-red-400"
        >
          <div className="text-4xl mb-2">⚠️</div>
          <p className="text-red-400 font-medium">
            {error}
          </p>
        </motion.div>
      )}

      {/* Transaction Info Form */}
      {activeMode === 'transaction' && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-8"
        >
          <form onSubmit={handleTransactionSubmit} className="space-y-6">
            <div>
              <label className="block text-cosmic-pinkLight text-sm mb-2">
                Transaction Name
              </label>
              <input
                type="text"
                value={transactionData.transactionName}
                onChange={(e) => setTransactionData({ ...transactionData, transactionName: e.target.value })}
                placeholder="e.g., Grocery Shopping, Flight, Restaurant"
                className="w-full px-4 py-3 rounded-xl bg-cosmic-deep/50 border border-cosmic-pink/20 
                         text-white placeholder-cosmic-gray focus:border-cosmic-pink focus:outline-none
                         transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-cosmic-pinkLight text-sm mb-2">
                Transaction Amount
              </label>
              <input
                type="text"
                value={transactionData.transactionAmount}
                onChange={(e) => setTransactionData({ ...transactionData, transactionAmount: e.target.value })}
                placeholder="Enter amount (e.g., $50.00)"
                className="w-full px-4 py-3 rounded-xl bg-cosmic-deep/50 border border-cosmic-pink/20 
                         text-white placeholder-cosmic-gray focus:border-cosmic-pink focus:outline-none
                         transition-colors"
                required
              />
            </div>

            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full btn-bubbly disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                'Log Transaction'
              )}
            </motion.button>
          </form>

          <p className="text-center text-cosmic-gray text-xs mt-4">
            Your transaction data is encrypted and secure. We never store your credentials.
          </p>
        </motion.div>
      )}

      {/* Receipt Scanner */}
      {activeMode === 'receipt' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-8"
        >
          <div className="text-center">
            {/* Upload Area */}
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-cosmic-pink/30 rounded-2xl p-10 
                            hover:border-cosmic-pink/60 transition-colors group">
                {receiptFile ? (
                  <div className="space-y-4">
                    <div className="text-5xl">🧾</div>
                    <p className="text-white font-medium">{receiptFile.name}</p>
                    <p className="text-cosmic-lavenderLight text-sm">
                      Click to change file
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-5xl group-hover:scale-110 transition-transform">
                      📷
                    </div>
                    <p className="text-white font-medium">
                      Tap to scan receipt
                    </p>
                    <p className="text-cosmic-lavenderLight text-sm">
                      or drag and drop an image
                    </p>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleReceiptUpload}
                className="hidden"
                disabled={isSubmitting}
              />
            </label>

            {isSubmitting && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6"
              >
                <div className="flex items-center justify-center gap-2 text-cosmic-pink">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Scanning receipt...</span>
                </div>
                <p className="text-cosmic-lavenderLight text-sm mt-2">
                  Analyzing carbon footprint from purchases
                </p>
              </motion.div>
            )}

            {/* Sample Receipts */}
            <div className="mt-8 pt-6 border-t border-cosmic-pink/20">
              <p className="text-cosmic-gray text-sm mb-4">Try with a sample receipt:</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={async () => {
                    setReceiptFile({ name: 'grocery_receipt.jpg' })
                    setIsSubmitting(true)
                    try {
                      const response = await parseReceiptText('Grocery: milk, eggs, bread, vegetables - $45.50')
                      setResult(response)
                      setSubmitted(true)
                    } catch (err) {
                      setError(err.message)
                    } finally {
                      setIsSubmitting(false)
                    }
                  }}
                  className="px-4 py-2 rounded-full glass text-sm text-cosmic-pinkLight
                           hover:bg-cosmic-pink/20 transition-colors"
                >
                  🛒 Grocery
                </button>
                <button
                  onClick={async () => {
                    setReceiptFile({ name: 'flight_ticket.jpg' })
                    setIsSubmitting(true)
                    try {
                      const response = await parseReceiptText('Flight: NYC to LA - $350.00')
                      setResult(response)
                      setSubmitted(true)
                    } catch (err) {
                      setError(err.message)
                    } finally {
                      setIsSubmitting(false)
                    }
                  }}
                  className="px-4 py-2 rounded-full glass text-sm text-cosmic-pinkLight
                           hover:bg-cosmic-pink/20 transition-colors"
                >
                  ✈️ Flight
                </button>
                <button
                  onClick={async () => {
                    setReceiptFile({ name: 'dining_receipt.jpg' })
                    setIsSubmitting(true)
                    try {
                      const response = await parseReceiptText('Restaurant: dinner for 2 - $85.00')
                      setResult(response)
                      setSubmitted(true)
                    } catch (err) {
                      setError(err.message)
                    } finally {
                      setIsSubmitting(false)
                    }
                  }}
                  className="px-4 py-2 rounded-full glass text-sm text-cosmic-pinkLight
                           hover:bg-cosmic-pink/20 transition-colors"
                >
                  🍽️ Dining
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default CarbonLogger
