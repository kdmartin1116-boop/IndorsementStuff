import React, { useState, useCallback, useRef } from 'react'
import { 
  Play, Pause, Square, Settings, Plus, Trash2, 
  ArrowRight, CheckCircle, AlertCircle, Clock,
  FileText, Users, Bell, Zap, GitBranch, Target
} from 'lucide-react'

interface WorkflowNode {
  id: string
  type: 'start' | 'process' | 'decision' | 'notification' | 'end'
  title: string
  description: string
  position: { x: number; y: number }
  config: any
  connections: string[]
}

interface WorkflowInstance {
  id: string
  workflowId: string
  status: 'running' | 'paused' | 'completed' | 'failed'
  currentNode: string
  startTime: Date
  completedTime?: Date
  data: any
}

interface Workflow {
  id: string
  name: string
  description: string
  nodes: WorkflowNode[]
  isActive: boolean
  triggers: string[]
  createdAt: Date
  lastModified: Date
}

const AdvancedWorkflowAutomation: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [workflowInstances, setWorkflowInstances] = useState<WorkflowInstance[]>([])
  const [designerMode, setDesignerMode] = useState(false)
  const [draggedNode, setDraggedNode] = useState<WorkflowNode | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Initialize with sample workflows
  React.useEffect(() => {
    const sampleWorkflows: Workflow[] = [
      {
        id: '1',
        name: 'Document Compliance Review',
        description: 'Automated compliance checking with Cornell legal validation',
        nodes: [
          {
            id: 'start',
            type: 'start',
            title: 'Document Received',
            description: 'New document uploaded for processing',
            position: { x: 50, y: 100 },
            config: { triggers: ['document_upload'] },
            connections: ['process1']
          },
          {
            id: 'process1',
            type: 'process',
            title: 'AI Legal Analysis',
            description: 'Cornell AI analysis with clause detection',
            position: { x: 250, y: 100 },
            config: { aiModel: 'cornell-legal-v2', timeout: 300 },
            connections: ['decision1']
          },
          {
            id: 'decision1',
            type: 'decision',
            title: 'Compliance Check',
            description: 'Evaluate compliance score',
            position: { x: 450, y: 100 },
            config: { condition: 'compliance_score > 85' },
            connections: ['notification1', 'notification2']
          },
          {
            id: 'notification1',
            type: 'notification',
            title: 'Approve Document',
            description: 'Notify stakeholders of approval',
            position: { x: 650, y: 50 },
            config: { recipients: ['legal_team'], template: 'approval' },
            connections: ['end']
          },
          {
            id: 'notification2',
            type: 'notification',
            title: 'Request Review',
            description: 'Send for manual review',
            position: { x: 650, y: 150 },
            config: { recipients: ['compliance_team'], template: 'review_needed' },
            connections: ['end']
          },
          {
            id: 'end',
            type: 'end',
            title: 'Process Complete',
            description: 'Workflow finished',
            position: { x: 850, y: 100 },
            config: {},
            connections: []
          }
        ],
        isActive: true,
        triggers: ['document_upload', 'manual_trigger'],
        createdAt: new Date('2024-01-15'),
        lastModified: new Date('2024-01-20')
      },
      {
        id: '2',
        name: 'Contract Generation Workflow',
        description: 'Automated contract creation with Cornell legal templates',
        nodes: [
          {
            id: 'start',
            type: 'start',
            title: 'Contract Request',
            description: 'New contract generation requested',
            position: { x: 50, y: 100 },
            config: { triggers: ['contract_request'] },
            connections: ['process1']
          },
          {
            id: 'process1',
            type: 'process',
            title: 'Template Selection',
            description: 'Choose appropriate Cornell legal template',
            position: { x: 250, y: 100 },
            config: { templateLibrary: 'cornell-contracts' },
            connections: ['process2']
          },
          {
            id: 'process2',
            type: 'process',
            title: 'Content Generation',
            description: 'Generate contract with AI assistance',
            position: { x: 450, y: 100 },
            config: { aiModel: 'contract-generator', validation: true },
            connections: ['notification1']
          },
          {
            id: 'notification1',
            type: 'notification',
            title: 'Review Ready',
            description: 'Contract ready for legal review',
            position: { x: 650, y: 100 },
            config: { recipients: ['legal_team'], attachment: true },
            connections: ['end']
          },
          {
            id: 'end',
            type: 'end',
            title: 'Ready for Signature',
            description: 'Contract generated and reviewed',
            position: { x: 850, y: 100 },
            config: {},
            connections: []
          }
        ],
        isActive: true,
        triggers: ['contract_request'],
        createdAt: new Date('2024-01-10'),
        lastModified: new Date('2024-01-18')
      }
    ]

    setWorkflows(sampleWorkflows)
    setSelectedWorkflow(sampleWorkflows[0])

    // Sample running instances
    const sampleInstances: WorkflowInstance[] = [
      {
        id: 'inst1',
        workflowId: '1',
        status: 'running',
        currentNode: 'process1',
        startTime: new Date('2024-01-25T10:30:00'),
        data: { documentId: 'doc123', fileName: 'contract_draft.pdf' }
      },
      {
        id: 'inst2',
        workflowId: '1',
        status: 'completed',
        currentNode: 'end',
        startTime: new Date('2024-01-25T09:15:00'),
        completedTime: new Date('2024-01-25T09:45:00'),
        data: { documentId: 'doc122', fileName: 'agreement.pdf' }
      }
    ]

    setWorkflowInstances(sampleInstances)
  }, [])

  const createNewWorkflow = () => {
    const newWorkflow: Workflow = {
      id: Date.now().toString(),
      name: 'New Workflow',
      description: 'Custom workflow with Cornell legal integration',
      nodes: [
        {
          id: 'start',
          type: 'start',
          title: 'Start',
          description: 'Workflow trigger',
          position: { x: 50, y: 100 },
          config: {},
          connections: []
        }
      ],
      isActive: false,
      triggers: [],
      createdAt: new Date(),
      lastModified: new Date()
    }

    setWorkflows(prev => [...prev, newWorkflow])
    setSelectedWorkflow(newWorkflow)
    setDesignerMode(true)
  }

  const triggerWorkflow = (workflowId: string, data: any = {}) => {
    const newInstance: WorkflowInstance = {
      id: Date.now().toString(),
      workflowId,
      status: 'running',
      currentNode: 'start',
      startTime: new Date(),
      data
    }

    setWorkflowInstances(prev => [...prev, newInstance])
  }

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'start': return <Play className="w-4 h-4" />
      case 'process': return <Settings className="w-4 h-4" />
      case 'decision': return <GitBranch className="w-4 h-4" />
      case 'notification': return <Bell className="w-4 h-4" />
      case 'end': return <Target className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'start': return '#10b981'
      case 'process': return '#3b82f6'
      case 'decision': return '#f59e0b'
      case 'notification': return '#8b5cf6'
      case 'end': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Play className="w-4 h-4 text-blue-500" />
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'paused': return <Pause className="w-4 h-4 text-yellow-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="workflow-automation">
      <div className="workflow-header">
        <div className="header-content">
          <div className="header-icon">
            <Zap className="w-8 h-8" />
          </div>
          <div>
            <h1>Advanced Workflow Automation</h1>
            <p>Automated document processing with Cornell Legal Framework integration</p>
          </div>
        </div>
        
        <div className="header-actions">
          <button
            onClick={createNewWorkflow}
            className="create-workflow-btn"
          >
            <Plus className="w-4 h-4" />
            Create Workflow
          </button>
          <button
            onClick={() => setDesignerMode(!designerMode)}
            className={`designer-toggle ${designerMode ? 'active' : ''}`}
          >
            <Settings className="w-4 h-4" />
            Designer
          </button>
        </div>
      </div>

      <div className="workflow-content">
        {/* Workflow List Sidebar */}
        <div className="workflow-sidebar">
          <div className="sidebar-section">
            <h3>Workflows</h3>
            <div className="workflow-list">
              {workflows.map(workflow => (
                <div
                  key={workflow.id}
                  className={`workflow-item ${selectedWorkflow?.id === workflow.id ? 'selected' : ''}`}
                  onClick={() => setSelectedWorkflow(workflow)}
                >
                  <div className="workflow-info">
                    <h4>{workflow.name}</h4>
                    <p>{workflow.description}</p>
                    <div className="workflow-status">
                      <span className={`status-badge ${workflow.isActive ? 'active' : 'inactive'}`}>
                        {workflow.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="node-count">{workflow.nodes.length} nodes</span>
                    </div>
                  </div>
                  <div className="workflow-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        triggerWorkflow(workflow.id)
                      }}
                      className="trigger-btn"
                      disabled={!workflow.isActive}
                    >
                      <Play className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Running Instances</h3>
            <div className="instance-list">
              {workflowInstances.map(instance => (
                <div key={instance.id} className="instance-item">
                  <div className="instance-status">
                    {getStatusIcon(instance.status)}
                  </div>
                  <div className="instance-info">
                    <h5>Instance {instance.id.slice(-4)}</h5>
                    <p>{instance.data.fileName || 'Unknown file'}</p>
                    <span className="instance-time">
                      {instance.startTime.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Workflow Designer/Viewer */}
        <div className="workflow-main">
          {selectedWorkflow && (
            <>
              <div className="workflow-toolbar">
                <div className="workflow-details">
                  <h2>{selectedWorkflow.name}</h2>
                  <p>{selectedWorkflow.description}</p>
                </div>
                
                <div className="workflow-controls">
                  <button
                    onClick={() => triggerWorkflow(selectedWorkflow.id)}
                    className="run-workflow-btn"
                    disabled={!selectedWorkflow.isActive}
                  >
                    <Play className="w-4 h-4" />
                    Run Workflow
                  </button>
                  <button className="edit-workflow-btn">
                    <Settings className="w-4 h-4" />
                    Configure
                  </button>
                </div>
              </div>

              <div
                ref={canvasRef}
                className="workflow-canvas"
              >
                <svg className="workflow-svg" width="100%" height="400">
                  {/* Draw connections between nodes */}
                  {selectedWorkflow.nodes.map(node => 
                    node.connections.map(connectionId => {
                      const targetNode = selectedWorkflow.nodes.find(n => n.id === connectionId)
                      if (!targetNode) return null

                      return (
                        <line
                          key={`${node.id}-${connectionId}`}
                          x1={node.position.x + 75}
                          y1={node.position.y + 30}
                          x2={targetNode.position.x + 25}
                          y2={targetNode.position.y + 30}
                          stroke="#d1d5db"
                          strokeWidth="2"
                          markerEnd="url(#arrowhead)"
                        />
                      )
                    })
                  )}

                  {/* Arrow marker definition */}
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill="#d1d5db"
                      />
                    </marker>
                  </defs>
                </svg>

                {/* Workflow Nodes */}
                {selectedWorkflow.nodes.map(node => (
                  <div
                    key={node.id}
                    className="workflow-node"
                    style={{
                      left: node.position.x,
                      top: node.position.y,
                      borderColor: getNodeColor(node.type)
                    }}
                  >
                    <div className="node-header" style={{ backgroundColor: getNodeColor(node.type) }}>
                      {getNodeIcon(node.type)}
                      <span className="node-type">{node.type.toUpperCase()}</span>
                    </div>
                    <div className="node-content">
                      <h4>{node.title}</h4>
                      <p>{node.description}</p>
                    </div>
                    {designerMode && (
                      <div className="node-actions">
                        <button className="node-action">
                          <Settings className="w-3 h-3" />
                        </button>
                        <button className="node-action delete">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {designerMode && (
                  <div className="node-palette">
                    <h4>Node Types</h4>
                    <div className="palette-nodes">
                      {['process', 'decision', 'notification'].map(type => (
                        <div
                          key={type}
                          className="palette-node"
                          draggable
                          onDragStart={() => setDraggedNode({
                            id: '',
                            type: type as any,
                            title: type.charAt(0).toUpperCase() + type.slice(1),
                            description: `New ${type} node`,
                            position: { x: 0, y: 0 },
                            config: {},
                            connections: []
                          })}
                        >
                          {getNodeIcon(type)}
                          <span>{type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Workflow Statistics */}
      <div className="workflow-stats">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <FileText className="w-6 h-6" />
            </div>
            <div className="stat-content">
              <h3>{workflows.length}</h3>
              <p>Total Workflows</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Play className="w-6 h-6" />
            </div>
            <div className="stat-content">
              <h3>{workflowInstances.filter(i => i.status === 'running').length}</h3>
              <p>Running Instances</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div className="stat-content">
              <h3>{workflowInstances.filter(i => i.status === 'completed').length}</h3>
              <p>Completed Today</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Zap className="w-6 h-6" />
            </div>
            <div className="stat-content">
              <h3>98.5%</h3>
              <p>Success Rate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdvancedWorkflowAutomation