"use client"

import React, { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Play, Phone, Plus, Trash, Copy, Home, BarChart2, PhoneOutgoing, Share2, CreditCard, PhoneCall, MessageCircle, X, FileText, ArrowLeftRight, PhoneOff, Box, Clock, Database, Wrench, MousePointer, MessageSquare, Cloud, Search } from "lucide-react"
import Draggable, { DraggableData, DraggableEvent } from "react-draggable"

interface CardData {
  id: number
  title: string
  content: string
  icon: React.ReactNode
  isEndCall?: boolean
}

interface Position {
  x: number
  y: number
}

interface Connection {
  start: number
  end: number
  startPosition: 'top' | 'bottom'
  endPosition: 'top' | 'bottom'
}

interface MenuItem {
  icon: React.ReactNode
  label: string
  isActive?: boolean
}

interface NodeComponent {
  icon: React.ReactNode
  label: string
  isEndCall?: boolean
}

export function DraggableCardsWithAnimatedConnections() {
  const [cards, setCards] = useState<CardData[]>([
    { id: 0, title: "Start", content: "Hey there, this is Not Bland Bistro reservation line. Do you want to make a reservation?", icon: <Play className="h-4 w-4 text-gray-600" /> },
    { id: 1, title: "Ask for reservation info", content: "Ask for the date, time, and number of guests. Ask each question one at a time.", icon: <Phone className="h-4 w-4 text-gray-600" /> }
  ])
  const [activeCard, setActiveCard] = useState<number | null>(null)
  const [selectedCard, setSelectedCard] = useState<number | null>(null)
  const [editingCard, setEditingCard] = useState<CardData | null>(null)
  const [positions, setPositions] = useState<{ [key: number]: Position }>({})
  const [connections, setConnections] = useState<Connection[]>([])
  const [draggingLine, setDraggingLine] = useState<{ start: number, startPosition: 'top' | 'bottom', end: Position } | null>(null)
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)
  const [showNodeComponents, setShowNodeComponents] = useState(false)
  const nodeRefs = useRef<{ [key: number]: React.RefObject<HTMLDivElement> }>({})
  const dotRefs = useRef<{ [key: number]: { top: React.RefObject<HTMLDivElement>, bottom: React.RefObject<HTMLDivElement> } }>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const menuItems: MenuItem[] = [
    { icon: <Home className="h-4 w-4" />, label: "Home" },
    { icon: <BarChart2 className="h-4 w-4" />, label: "Analytics" },
    { icon: <PhoneOutgoing className="h-4 w-4" />, label: "Send Call" },
    { icon: <Share2 className="h-4 w-4" />, label: "Conversational Pathways", isActive: true },
    { icon: <CreditCard className="h-4 w-4" />, label: "Purchase Credits" },
    { icon: <PhoneCall className="h-4 w-4" />, label: "Phone Numbers" },
    { icon: <MessageCircle className="h-4 w-4" />, label: "Voices" },
  ]

  const nodeComponents: NodeComponent[] = [
    { icon: <Phone className="h-5 w-5" />, label: "Default Node" },
    { icon: <FileText className="h-5 w-5" />, label: "Knowledge Base" },
    { icon: <ArrowLeftRight className="h-5 w-5" />, label: "Transfer Call" },
    { icon: <PhoneOff className="h-5 w-5" />, label: "End Call", isEndCall: true },
    { icon: <Box className="h-5 w-5" />, label: "Webhook" },
    { icon: <Clock className="h-5 w-5" />, label: "Wait for Response" },
    { icon: <Database className="h-5 w-5" />, label: "Vector DB" },
    { icon: <Share2 className="h-5 w-5" />, label: "Transfer Pathway" },
    { icon: <Wrench className="h-5 w-5" />, label: "Custom Tool" },
    { icon: <MousePointer className="h-5 w-5" />, label: "Press Button" },
    { icon: <MessageSquare className="h-5 w-5" />, label: "SMS" },
    { icon: <Cloud className="h-5 w-5" />, label: "Amazon Connect" },
  ]

  useEffect(() => {
    const updatePositions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        const cardWidth = 320
        const cardHeight = 200
        const topMargin = 32

        setPositions(prev => {
          const newPositions = { ...prev }
          cards.forEach((card, index) => {
            if (!(card.id in newPositions)) {
              newPositions[card.id] = {
                x: (containerWidth - cardWidth) / 2,
                y: topMargin + (cardHeight + 16) * index
              }
            }
          })
          return newPositions
        })
      }
    }

    updatePositions()
    window.addEventListener('resize', updatePositions)
    return () => window.removeEventListener('resize', updatePositions)
  }, [cards])

  const handleDragStart = (cardId: number) => {
    setActiveCard(cardId)
  }

  const handleDragStop = (cardId: number, e: DraggableEvent, data: DraggableData) => {
    setActiveCard(null)
    setPositions(prev => ({
      ...prev,
      [cardId]: { x: data.x, y: data.y }
    }))
  }

  const handleDrag = (cardId: number, e: DraggableEvent, data: DraggableData) => {
    setPositions(prev => ({
      ...prev,
      [cardId]: { x: data.x, y: data.y }
    }))
  }

  const handleCardClick = (cardId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedCard(prev => prev === cardId ? null : cardId)
  }

  const handleCardDoubleClick = (card: CardData, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingCard(card)
  }

  const handleEditSave = () => {
    if (editingCard) {
      setCards(prev => prev.map(card => card.id === editingCard.id ? editingCard : card))
      setEditingCard(null)
    }
  }

  const handleDotMouseDown = (cardId: number, position: 'top' | 'bottom') => (e: React.MouseEvent) => {
    e.stopPropagation()
    const rect = svgRef.current?.getBoundingClientRect()
    if (rect) {
      const dotRect = dotRefs.current[cardId]?.[position].current?.getBoundingClientRect()
      if (dotRect) {
        const startPos = {
          x: dotRect.left + dotRect.width / 2 - rect.left,
          y: dotRect.top + dotRect.height / 2 - rect.top
        }
        setDraggingLine({ 
          start: cardId, 
          startPosition: position, 
          end: startPos
        })
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingLine) {
      const rect = svgRef.current?.getBoundingClientRect()
      if (rect) {
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        setDraggingLine(prev => prev ? { ...prev, end: { x, y } } : null)
      }
    }
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingLine) {
      const endCard = cards.find(card => {
        const topDotRect = dotRefs.current[card.id]?.top.current?.getBoundingClientRect()
        const bottomDotRect = dotRefs.current[card.id]?.bottom.current?.getBoundingClientRect()
        if (topDotRect && bottomDotRect) {
          const mouseX = e.clientX
          const mouseY = e.clientY
          const threshold = 10 // pixels
          return (
            (Math.abs(mouseX - (topDotRect.left + topDotRect.width / 2)) < threshold && 
             Math.abs(mouseY - (topDotRect.top + topDotRect.height / 2)) < threshold) ||
            (Math.abs(mouseX - (bottomDotRect.left + bottomDotRect.width / 2)) < threshold && 
             Math.abs(mouseY - (bottomDotRect.top + bottomDotRect.height / 2)) < threshold)
          )
        }
        return false
      })

      if (endCard && endCard.id !== draggingLine.start) {
        const topDotRect = dotRefs.current[endCard.id]?.top.current?.getBoundingClientRect()
        const bottomDotRect = dotRefs.current[endCard.id]?.bottom.current?.getBoundingClientRect()
        if (topDotRect && bottomDotRect) {
          const endPosition = Math.abs(e.clientY - (topDotRect.top + topDotRect.height / 2)) <
                              Math.abs(e.clientY - (bottomDotRect.top + bottomDotRect.height / 2)) ? 'top' : 'bottom'
          setConnections(prev => [...prev, { 
            start: draggingLine.start, 
            end: endCard.id, 
            startPosition: draggingLine.startPosition, 
            endPosition 
          }])
        }
      }
      setDraggingLine(null)
    }
  }

  const addNewNode = (component?: NodeComponent) => {
    const newId = Math.max(...cards.map(card => card.id), 0) + 1
    const newCard: CardData = {
      id: newId,
      title: component ? component.label : `Node ${newId}`,
      content: "New node content",
      icon: component ? component.icon : <Plus className="h-4 w-4 text-gray-600" />,
      isEndCall: component?.isEndCall
    }
    setCards(prev => [...prev, newCard])

    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth
      const cardWidth = 320
      const cardHeight = 200
      const topMargin = 32

      setPositions(prev => ({
        ...prev,
        [newId]: { 
          x: (containerWidth - cardWidth) / 2, 
          y: topMargin + (cardHeight + 16) * cards.length 
        }
      }))
    }

    setShowNodeComponents(false)
  }

  const deleteCard = (cardId: number) => {
    setCards(prev => prev.filter(card => card.id !== cardId))
    setPositions(prev => {
      const newPositions = { ...prev }
      delete newPositions[cardId]
      return newPositions
    })
    setConnections(prev => prev.filter(conn => conn.start !== cardId && conn.end !== cardId))
    setSelectedCard(null)
  }

  const duplicateCard = (card: CardData) => {
    const newId = Math.max(...cards.map(card => card.id), 0) + 1
    const newCard: CardData = {
      ...card,
      id: newId,
      title: `${card.title} (Copy)`
    }
    setCards(prev => [...prev, newCard])
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth
      const cardWidth = 320
      const cardHeight = 200
      setPositions(prev => ({
        ...prev,
        [newId]: { 
          x: (containerWidth - cardWidth) / 2, 
          y: (prev[card.id]?.y || 0) + cardHeight + 16
        }
      }))
    }
  }

  const renderCard = (card: CardData) => (
    <Draggable
      key={card.id}
      nodeRef={nodeRefs.current[card.id] || (nodeRefs.current[card.id] = React.createRef())}
      position={positions[card.id] || { x: 0, y: 0 }}
      onStart={() => handleDragStart(card.id)}
      onDrag={(e, data) => handleDrag(card.id, e, data)}
      onStop={(e, data) => handleDragStop(card.id, e, data)}
      bounds="parent"
    >
      <div ref={nodeRefs.current[card.id]} className="absolute">
        {card.id !== 0 && (
          <div 
            ref={dotRefs.current[card.id]?.top || (dotRefs.current[card.id] = { top: React.createRef(), bottom: React.createRef() }).top}
            className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 cursor-pointer z-10"
            onMouseDown={handleDotMouseDown(card.id, 'top')}
          >
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
        )}
        <Card 
          className={`w-80 rounded-xl overflow-hidden shadow-sm bg-white cursor-move transition-all duration-300 ${
            activeCard === card.id || selectedCard === card.id ? "border-2 border-blue-500" : "border border-gray-200"
          }`}
          onClick={(e) => handleCardClick(card.id, e)}
          onDoubleClick={(e) => handleCardDoubleClick(card, e)}
        >
          <CardHeader className="p-4 pb-2 flex flex-col space-y-0">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <div className={`rounded-md p-1 ${card.isEndCall ? "bg-white" : "bg-gray-100"}`}>
                  {React.cloneElement(card.icon as React.ReactElement, { 
                    className: `h-4 w-4 ${card.isEndCall ? "text-red-500" : "text-gray-500"}` 
                  })}
                </div>
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              </div>
              <div className="flex space-x-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); duplicateCard(card); }}>
                  <Copy className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); deleteCard(card.id); }}>
                  <Trash className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <p className="text-xs text-gray-600">{card.content}</p>
          </CardContent>
        </Card>
        <div 
          ref={dotRefs.current[card.id]?.bottom || (dotRefs.current[card.id] = { top: React.createRef(), bottom: React.createRef() }).bottom}
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 cursor-pointer z-10"
          onMouseDown={handleDotMouseDown(card.id, 'bottom')}
        >
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        </div>
      </div>
    </Draggable>
  )

  const getDotPosition = (cardId: number, position: 'top' | 'bottom'): Position => {
    const dotRect = dotRefs.current[cardId]?.[position].current?.getBoundingClientRect()
    const svgRect = svgRef.current?.getBoundingClientRect()
    if (dotRect && svgRect) {
      return {
        x: dotRect.left + dotRect.width / 2 - svgRect.left,
        y: dotRect.top + dotRect.height / 2 - svgRect.top
      }
    }
    return { x: 0, y: 0 }
  }

  const renderConnection = (conn: Connection, index: number) => {
    const start = getDotPosition(conn.start, conn.startPosition)
    const end = getDotPosition(conn.end, conn.endPosition)
    const midX = (start.x + end.x) / 2
    const midY = (start.y + end.y) / 2
    
    let controlPoint1, controlPoint2

    if (conn.startPosition === 'top' && conn.endPosition === 'top') {
      const highestY = Math.min(start.y, end.y)
      const controlY = highestY - 100 // Adjust this value to change the curve
      controlPoint1 = { x: start.x, y: controlY }
      controlPoint2 = { x: end.x, y: controlY }
    } else if (conn.startPosition === 'bottom' && conn.endPosition === 'bottom') {
      const lowestY = Math.max(start.y, end.y)
      const controlY = lowestY + 100 // Adjust this value to change the curve
      controlPoint1 = { x: start.x, y: controlY }
      controlPoint2 = { x: end.x, y: controlY }
    } else {
      controlPoint1 = { x: midX, y: start.y }
      controlPoint2 = { x: midX, y: end.y }
    }

    return (
      <g key={index}>
        <path
          d={`M ${start.x},${start.y} C ${controlPoint1.x},${controlPoint1.y} ${controlPoint2.x},${controlPoint2.y} ${end.x},${end.y}`}
          stroke="#d1d5db"
          strokeWidth="2"
          fill="none"
          strokeDasharray="4 4"
        />
        <path
          d={`M ${start.x},${start.y} C ${controlPoint1.x},${controlPoint1.y} ${controlPoint2.x},${controlPoint2.y} ${end.x},${end.y}`}
          stroke="#d1d5db"
          strokeWidth="2"
          fill="none"
          strokeDasharray="4 4"
          className="animate-dash"
        />
      </g>
    )
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 flex flex-col py-4 transition-all duration-300 ease-in-out z-50 ${
          isMenuExpanded ? 'w-64' : 'w-16'
        }`}
        onMouseEnter={() => setIsMenuExpanded(true)}
        onMouseLeave={() => setIsMenuExpanded(false)}
      >
        <div className={`flex items-center ${isMenuExpanded ? 'px-4' : 'justify-center'} mb-8`}>
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
            <Phone className="h-4 w-4 text-white" />
          </div>
          {isMenuExpanded && (
            <span className="ml-3 font-semibold text-sm text-black">
              NewVoice.ai
            </span>
          )}
        </div>
        {menuItems.map((item, index) => (
          <Button
            key={index}
            variant="ghost"
            className={`flex items-center ${isMenuExpanded ? 'justify-start px-4' : 'justify-center'} py-2 mb-1 ${
              item.isActive ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {item.icon}
            {isMenuExpanded && <span className={`ml-3 text-xs ${item.isActive ? 'font-medium' : ''}`}>{item.label}</span>}
          </Button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 ml-16">
        <div 
          ref={containerRef}
          className="relative w-full h-full overflow-hidden" 
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={() => {
            setSelectedCard(null)
            setShowNodeComponents(false)
          }}
          style={{
            backgroundImage: `
              radial-gradient(circle, #d1d5db 1px, transparent 1px),
              radial-gradient(circle, #d1d5db 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            backgroundPosition: '0 0, 20px 20px'
          }}
        >
          <style jsx>{`
            @keyframes dash {
              to {
                stroke-dashoffset: -8;
              }
            }
            .animate-dash {
              animation: dash 0.5s linear infinite;
            }
          `}</style>
          <Button
            className="absolute top-4 left-4 z-10 bg-white text-black border border-gray-300 rounded-md px-4 py-2 text-xs font-normal hover:bg-gray-100 transition-colors duration-200"
            onClick={(e) => {
              e.stopPropagation()
              setShowNodeComponents(true)
            }}
          >
            Add new node
          </Button>
          <svg 
            ref={svgRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
          >
            {connections.map(renderConnection)}
            {draggingLine && (
              <path
                d={`M ${getDotPosition(draggingLine.start, draggingLine.startPosition).x},${getDotPosition(draggingLine.start, draggingLine.startPosition).y} L ${draggingLine.end.x},${draggingLine.end.y}`}
                stroke="#d1d5db"
                strokeWidth="2"
                fill="none"
                strokeDasharray="4 4"
              />
            )}
          </svg>
          {cards.map(renderCard)}
          <Dialog open={!!editingCard} onOpenChange={() => setEditingCard(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Card</DialogTitle>
              </DialogHeader>
              {editingCard && (
                <>
                  <Input
                    value={editingCard.title}
                    onChange={(e) => setEditingCard(prev => prev ? {...prev, title: e.target.value} : null)}
                    placeholder="Card Title"
                    className="mb-4"
                  />
                  <Textarea
                    value={editingCard.content}
                    onChange={(e) => setEditingCard(prev => prev ? {...prev, content: e.target.value} : null)}
                    placeholder="Card Content"
                    className="mb-4"
                  />
                  <DialogFooter>
                    <Button onClick={handleEditSave}>Save Changes</Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
          {showNodeComponents && (
            <div className="absolute top-0 right-0 w-96 h-full bg-white shadow-lg overflow-y-auto z-50">
              <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-800">Add New Node</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowNodeComponents(false)}>
                  <X className="h-4 w-4 text-gray-500" />
                </Button>
              </div>
              <div className="p-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input placeholder="Search Node" className="pl-10 py-1.5 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {nodeComponents.map((component, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="flex flex-col items-center justify-center h-24 text-center p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => addNewNode(component)}
                    >
                      {React.cloneElement(component.icon as React.ReactElement, { className: "h-6 w-6 mb-2 text-gray-500" })}
                      <span className="text-xs text-gray-700 font-normal">{component.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}