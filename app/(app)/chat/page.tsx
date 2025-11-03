'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Trash2 } from 'lucide-react'
import { Message } from '@/components/chat/message'
import { TypingIndicator } from '@/components/chat/typing-indicator'
import type { ChatMessage } from '@/lib/chat/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const SUGGESTED_PROMPTS = [
  "Show yesterday's performance",
  'List all my accounts',
  'Check for disapproved ads',
  'Which campaigns are spending the most?',
  'Show me keywords with low quality scores',
  'Generate and send a report',
]

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Load messages from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('chat-messages')
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ChatMessage[]
        setMessages(
          parsed.map((msg) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }))
        )
      } catch (error) {
        console.error('Failed to load chat history:', error)
      }
    } else {
      // Add welcome message if no history
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content:
            "Hi! I'm your Google Ads assistant. Ask me anything about your account performance, campaigns, keywords, or I can help you generate reports. Try one of the suggested prompts below to get started!",
          timestamp: new Date(),
        },
      ])
    }
  }, [])

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chat-messages', JSON.stringify(messages))
    }
  }, [messages])

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input.trim()
    if (!textToSend || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.slice(-10), // Send last 10 messages for context
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to get response')
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear the chat history?')) {
      localStorage.removeItem('chat-messages')
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content:
            "Hi! I'm your Google Ads assistant. Ask me anything about your account performance, campaigns, keywords, or I can help you generate reports.",
          timestamp: new Date(),
        },
      ])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chat Assistant</h1>
          <p className="text-sm text-muted mt-1">
            Ask questions about your Google Ads accounts, campaigns, and keywords
          </p>
        </div>
        <Button
          onClick={handleClearHistory}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Clear History
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <Message key={message.id} message={message} />
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                AI
              </div>
              <div className="flex-1">
                <TypingIndicator />
              </div>
            </div>
          )}

          {/* Suggested prompts - only show if there are 2 or fewer messages */}
          {messages.length <= 2 && !isLoading && (
            <div className="py-4">
              <p className="text-sm text-muted mb-3">Try asking:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="text-left px-4 py-3 rounded-lg border border-border bg-surface hover:bg-primary-light transition-colors text-sm"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-surface px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your accounts, campaigns, or keywords..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Send
            </Button>
          </div>
          <p className="text-xs text-muted mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}
