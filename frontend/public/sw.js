// ===========================================
// SOVEREIGN LEGAL PWA SERVICE WORKER
// Enhanced Cornell Legal Platform with Advanced PWA Capabilities
// ===========================================

const SW_VERSION = 'sovereign-legal-v2.0.0';
const CACHE_NAME = `sovereign-legal-app-${SW_VERSION}`;
const CORNELL_LEGAL_CACHE = `cornell-legal-knowledge-${SW_VERSION}`;
const API_CACHE = `sovereign-api-${SW_VERSION}`;
const OFFLINE_CACHE = `sovereign-offline-${SW_VERSION}`;
const DOCUMENTS_CACHE = `sovereign-documents-${SW_VERSION}`;

// ===========================================
// CACHE CONFIGURATION
// ===========================================

// Cornell Legal Knowledge - Critical offline resources (preserved from original)
const CORNELL_LEGAL_URLS = [
  'https://www.law.cornell.edu/ucc/3/3-104',
  'https://www.law.cornell.edu/ucc/3/3-302', 
  'https://www.law.cornell.edu/ucc/3/3-205',
  'https://www.law.cornell.edu/ucc/3/3-201',
  'https://www.law.cornell.edu/ucc/3',
  'https://www.law.cornell.edu/uscode/text/8/1401',
  'https://www.law.cornell.edu/uscode/text/8/1408'
];

// Enhanced static resources for PWA
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/icons/badge-72x72.png'
];

// API endpoints to cache for offline functionality
const API_ENDPOINTS = [
  '/api/user/profile',
  '/api/documents/recent',
  '/api/notifications',
  '/api/settings'
];

// Cornell Legal Knowledge Database - Enhanced (preserved from original)
const CORNELL_LEGAL_KNOWLEDGE = {
  'ucc-3-104': {
    title: 'UCC § 3-104 - Negotiable Instrument Requirements',
    content: 'A negotiable instrument must be: (1) in writing and signed, (2) contain unconditional promise or order to pay, (3) state fixed amount of money, (4) payable on demand or definite time, (5) payable to order or bearer',
    url: 'https://www.law.cornell.edu/ucc/3/3-104',
    category: 'Uniform Commercial Code',
    section: '3-104'
  },
  'ucc-3-302': {
    title: 'UCC § 3-302 - Holder in Due Course',
    content: 'Holder in due course protection requires: (1) valid negotiable instrument, (2) good faith acquisition, (3) value given, (4) no notice of defects or claims',
    url: 'https://www.law.cornell.edu/ucc/3/3-302',
    category: 'Uniform Commercial Code',
    section: '3-302'
  },
  'ucc-3-205': {
    title: 'UCC § 3-205 - Indorsement Rules',
    content: 'Special indorsements identify specific person. Blank indorsements make instrument bearer paper. Restrictive indorsements limit further negotiation.',
    url: 'https://www.law.cornell.edu/ucc/3/3-205',
    category: 'Uniform Commercial Code',
    section: '3-205'
  },
  'sovereignty-fundamentals': {
    title: 'Sovereign Individual Status - Core Principles',
    content: 'Foundation principles of individual sovereignty include: (1) natural birth rights, (2) private contract law supremacy, (3) commercial liability protection, (4) administrative remedy processes',
    category: 'Sovereignty',
    section: 'Fundamentals'
  },
  'bill-discharge-process': {
    title: 'Bill Discharge Process - Administrative Remedy',
    content: 'Administrative bill discharge follows: (1) proper acceptance for value, (2) conditional acceptance with questions, (3) discharge through setoff, (4) notice of administrative process',
    category: 'Bill Discharge',
    section: 'Process'
  }
};

// Offline sync queue
let offlineQueue = [];
const MAX_QUEUE_SIZE = 100;

// Network status
let isOnline = true;

// ===========================================
// SERVICE WORKER LIFECYCLE
// ===========================================

// Install Service Worker with enhanced caching
self.addEventListener('install', (event) => {
  console.log(`🚀 Sovereign Legal PWA: Installing Service Worker ${SW_VERSION}`);
  
  event.waitUntil(
    Promise.all([
      // Cache static resources
      caches.open(CACHE_NAME).then((cache) => {
        console.log('📦 Caching static resources');
        return cache.addAll(STATIC_RESOURCES).catch(error => {
          console.warn('⚠️ Some static resources failed to cache:', error);
          // Cache individual resources that succeed
          return Promise.all(
            STATIC_RESOURCES.map(url => 
              cache.add(url).catch(err => console.warn(`Failed to cache ${url}:`, err))
            )
          );
        });
      }),
      
      // Cache Cornell legal knowledge for offline access (enhanced)
      caches.open(CORNELL_LEGAL_CACHE).then((cache) => {
        console.log('⚖️ Caching Cornell legal knowledge');
        return Promise.all([
          // Store offline legal knowledge database
          ...Object.entries(CORNELL_LEGAL_KNOWLEDGE).map(([key, knowledge]) => {
            const response = new Response(JSON.stringify(knowledge), {
              headers: { 
                'Content-Type': 'application/json',
                'X-Cached-At': new Date().toISOString(),
                'X-Cache-Version': SW_VERSION
              }
            });
            return cache.put(`/cornell-legal/${key}`, response);
          }),
          // Pre-cache critical API responses
          ...API_ENDPOINTS.map(endpoint => 
            fetch(endpoint).then(response => {
              if (response.ok) {
                return cache.put(endpoint, response);
              }
            }).catch(() => {}) // Ignore failures during install
          )
        ]);
      }),

      // Initialize offline queue cache
      caches.open(OFFLINE_CACHE).then((cache) => {
        console.log('📱 Initializing offline capabilities');
        const offlineData = {
          queue: [],
          timestamp: new Date().toISOString(),
          version: SW_VERSION
        };
        return cache.put('/offline-queue', 
          new Response(JSON.stringify(offlineData), {
            headers: { 'Content-Type': 'application/json' }
          })
        );
      })
    ]).then(() => {
      console.log('✅ Sovereign Legal PWA: Installation complete');
      // Skip waiting to activate immediately
      return self.skipWaiting();
    }).catch(error => {
      console.error('❌ Installation failed:', error);
    })
  );
});

// Activate Service Worker with enhanced cleanup
self.addEventListener('activate', (event) => {
  console.log(`🎯 Sovereign Legal PWA: Activating Service Worker ${SW_VERSION}`);
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Keep current version caches
            if (cacheName !== CACHE_NAME && 
                cacheName !== CORNELL_LEGAL_CACHE && 
                cacheName !== API_CACHE &&
                cacheName !== OFFLINE_CACHE &&
                cacheName !== DOCUMENTS_CACHE) {
              console.log('🧹 Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),

      // Load offline queue from cache
      loadOfflineQueue(),

      // Notify clients of activation
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            version: SW_VERSION,
            timestamp: new Date().toISOString()
          });
        });
      })
    ]).then(() => {
      console.log('✅ Sovereign Legal PWA: Activation complete');
      return self.clients.claim();
    })
  );
});

// ===========================================
// FETCH STRATEGY - ENHANCED ROUTING
// ===========================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-HTTP requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Route requests to appropriate handlers
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else if (url.pathname.startsWith('/cornell-legal/') || 
             url.pathname.startsWith('/api/cornell-legal/')) {
    event.respondWith(handleCornellLegalRequest(request));
  } else if (url.hostname === 'www.law.cornell.edu') {
    event.respondWith(handleCornellExternalRequest(request));
  } else if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
  } else if (request.destination === 'document' || 
             url.pathname.includes('/documents/')) {
    event.respondWith(handleDocumentRequest(request));
  } else {
    event.respondWith(handleStaticRequest(request));
  }
});

// ===========================================
// REQUEST HANDLERS
// ===========================================

// Enhanced API request handler with offline support
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first
    const networkResponse = await fetch(request.clone());
    
    if (networkResponse.ok) {
      // Cache successful GET requests
      if (request.method === 'GET') {
        const cache = await caches.open(API_CACHE);
        await cache.put(request, networkResponse.clone());
      }
      
      // Handle POST/PUT/DELETE - queue for offline sync if needed
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        // Process sync queue if online
        processSyncQueue();
      }
      
      return networkResponse;
    }
  } catch (error) {
    console.log('🌐 API request failed, handling offline:', url.pathname);
    
    // Handle offline API requests
    if (request.method === 'GET') {
      // Try to serve from cache
      const cache = await caches.open(API_CACHE);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        // Add offline header
        const response = cachedResponse.clone();
        response.headers.set('X-Served-From-Cache', 'true');
        return response;
      }
      
      // Return offline data if available
      return getOfflineApiResponse(url.pathname);
    } else {
      // Queue write operations for later sync
      await queueOfflineAction(request);
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Action queued for sync when online',
        queued: true
      }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}

// Enhanced document handling with caching
async function handleDocumentRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache documents for offline access
      const cache = await caches.open(DOCUMENTS_CACHE);
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('📄 Document request failed, serving cached version');
  }
  
  // Serve from cache
  const cache = await caches.open(DOCUMENTS_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  return new Response('Document not available offline', { 
    status: 404,
    headers: { 'Content-Type': 'text/plain' }
  });
}

// Enhanced Cornell Legal Knowledge Handler
async function handleCornellLegalRequest(request) {
  const url = new URL(request.url);
  const legalKnowledgeKey = url.pathname.split('/').pop();
  
  try {
    // Try network first for latest legal updates
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache successful responses with enhanced metadata
      const cache = await caches.open(CORNELL_LEGAL_CACHE);
      const enhancedResponse = networkResponse.clone();
      enhancedResponse.headers.set('X-Cached-At', new Date().toISOString());
      enhancedResponse.headers.set('X-Cache-Version', SW_VERSION);
      await cache.put(request, enhancedResponse);
      return networkResponse;
    }
  } catch (error) {
    console.log('⚖️ Cornell Legal network failed, serving cached knowledge');
  }
  
  // Fallback to cached Cornell legal knowledge
  const cache = await caches.open(CORNELL_LEGAL_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Add offline indicator
    const response = cachedResponse.clone();
    response.headers.set('X-Served-From-Cache', 'true');
    return response;
  }
  
  // Ultimate fallback - return embedded legal knowledge
  if (CORNELL_LEGAL_KNOWLEDGE[legalKnowledgeKey]) {
    return new Response(
      JSON.stringify({
        ...CORNELL_LEGAL_KNOWLEDGE[legalKnowledgeKey],
        offline: true,
        cachedAt: new Date().toISOString()
      }), 
      { 
        headers: { 
          'Content-Type': 'application/json',
          'X-Served-By': 'Sovereign Legal PWA Cache',
          'X-Offline-Source': 'embedded-knowledge'
        } 
      }
    );
  }
  
  // Search for partial matches in legal knowledge
  const searchTerm = legalKnowledgeKey.toLowerCase();
  const matchedKnowledge = Object.entries(CORNELL_LEGAL_KNOWLEDGE)
    .filter(([key, knowledge]) => 
      key.includes(searchTerm) || 
      knowledge.title.toLowerCase().includes(searchTerm) ||
      knowledge.content.toLowerCase().includes(searchTerm)
    )
    .map(([key, knowledge]) => ({ key, ...knowledge }));
  
  if (matchedKnowledge.length > 0) {
    return new Response(
      JSON.stringify({
        query: legalKnowledgeKey,
        matches: matchedKnowledge,
        offline: true,
        searchResults: true
      }), 
      { 
        headers: { 
          'Content-Type': 'application/json',
          'X-Served-By': 'Sovereign Legal PWA Search'
        } 
      }
    );
  }
  
  return new Response(
    JSON.stringify({ 
      error: 'Cornell legal knowledge not available offline',
      availableKnowledge: Object.keys(CORNELL_LEGAL_KNOWLEDGE),
      suggestion: 'Try one of the available knowledge keys'
    }), 
    { 
      status: 404, 
      headers: { 'Content-Type': 'application/json' } 
    }
  );
}

// Enhanced Cornell LII external request handler
async function handleCornellExternalRequest(request) {
  try {
    // Try to fetch from network with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const networkResponse = await fetch(request, { 
      mode: 'cors',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (networkResponse.ok) {
      // Cache for offline access with metadata
      const cache = await caches.open(CORNELL_LEGAL_CACHE);
      const responseToCache = networkResponse.clone();
      responseToCache.headers.set('X-Cached-At', new Date().toISOString());
      await cache.put(request, responseToCache);
      return networkResponse;
    }
  } catch (error) {
    console.log('🏛️ Cornell LII offline, serving cached or embedded version');
  }
  
  // Serve cached version if available
  const cache = await caches.open(CORNELL_LEGAL_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    const response = cachedResponse.clone();
    response.headers.set('X-Served-From-Cache', 'true');
    return response;
  }
  
  // Return enhanced offline notice for Cornell resources
  return new Response(
    `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sovereign Legal - Offline Cornell Resource</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', system-ui, sans-serif; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          color: white;
        }
        .offline-container { 
          background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);
          padding: 3rem; border-radius: 20px; text-align: center; max-width: 500px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .icon { font-size: 4rem; margin-bottom: 1rem; }
        h1 { font-size: 2rem; margin-bottom: 1rem; }
        p { margin-bottom: 1rem; opacity: 0.9; line-height: 1.6; }
        .button-group { display: flex; gap: 1rem; justify-content: center; margin-top: 2rem; }
        button { 
          background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3);
          padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; font-size: 1rem;
          transition: all 0.3s ease;
        }
        button:hover { background: rgba(255,255,255,0.3); transform: translateY(-2px); }
        .knowledge-preview { 
          background: rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 10px; margin-top: 2rem;
          text-align: left;
        }
        .knowledge-item { margin-bottom: 1rem; }
        .knowledge-title { font-weight: bold; color: #ffd700; }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="icon">🏛️</div>
        <h1>Cornell Legal Resource</h1>
        <p>You're currently offline. This Cornell Law resource is not available in cache.</p>
        <p>While you wait to reconnect, here's some relevant legal knowledge available offline:</p>
        
        <div class="knowledge-preview">
          <div class="knowledge-item">
            <div class="knowledge-title">UCC § 3-104 - Negotiable Instruments</div>
            <p>Requirements for valid negotiable instruments</p>
          </div>
          <div class="knowledge-item">
            <div class="knowledge-title">UCC § 3-302 - Holder in Due Course</div>
            <p>Protection requirements and acquisition rules</p>
          </div>
          <div class="knowledge-item">
            <div class="knowledge-title">Sovereignty Fundamentals</div>
            <p>Core principles of individual sovereignty</p>
          </div>
        </div>
        
        <div class="button-group">
          <button onclick="window.location.reload()">🔄 Try Again</button>
          <button onclick="window.history.back()">← Go Back</button>
          <button onclick="window.location.href='/'">🏠 Home</button>
        </div>
      </div>
      
      <script>
        // Auto-retry when online
        window.addEventListener('online', () => {
          setTimeout(() => window.location.reload(), 1000);
        });
      </script>
    </body>
    </html>`,
    { 
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      status: 200
    }
  );
}

// Enhanced navigation request handler
async function handleNavigationRequest(request) {
  try {
    // Try network first for latest content
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      return networkResponse;
    }
  } catch (error) {
    console.log('📱 Navigation offline, serving cached app shell');
  }
  
  // Serve cached app shell or offline page
  const cache = await caches.open(CACHE_NAME);
  
  // Try to serve the specific cached page first
  let cachedResponse = await cache.match(request.url);
  
  if (!cachedResponse) {
    // Fallback to app shell
    cachedResponse = await cache.match('/') || await cache.match('/index.html');
  }
  
  if (!cachedResponse) {
    // Final fallback to offline page
    cachedResponse = await cache.match('/offline.html');
  }
  
  return cachedResponse || new Response('App not available offline', {
    status: 503,
    headers: { 'Content-Type': 'text/plain' }
  });
}

// Enhanced static resource handler with stale-while-revalidate
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Serve from cache immediately (stale-while-revalidate)
  const cachedResponse = await cache.match(request);
  
  // Update cache in background
  const networkPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(error => {
    console.log('📦 Static resource network update failed:', request.url);
    return null;
  });
  
  // Return cached version if available, otherwise wait for network
  if (cachedResponse) {
    // Update in background but serve cached version
    networkPromise.catch(() => {}); // Ignore background errors
    return cachedResponse;
  }
  
  try {
    // No cached version, must wait for network
    const networkResponse = await networkPromise;
    if (networkResponse && networkResponse.ok) {
      return networkResponse;
    }
  } catch (error) {
    console.log('📦 Static resource unavailable:', request.url);
  }
  
  return new Response('Resource not available offline', { 
    status: 404,
    headers: { 'Content-Type': 'text/plain' }
  });
}

// ===========================================
// OFFLINE FUNCTIONALITY
// ===========================================

// Load offline queue from cache
async function loadOfflineQueue() {
  try {
    const cache = await caches.open(OFFLINE_CACHE);
    const response = await cache.match('/offline-queue');
    
    if (response) {
      const data = await response.json();
      offlineQueue = data.queue || [];
      console.log(`📥 Loaded ${offlineQueue.length} items from offline queue`);
    }
  } catch (error) {
    console.error('❌ Failed to load offline queue:', error);
    offlineQueue = [];
  }
}

// Save offline queue to cache
async function saveOfflineQueue() {
  try {
    const cache = await caches.open(OFFLINE_CACHE);
    const queueData = {
      queue: offlineQueue,
      timestamp: new Date().toISOString(),
      version: SW_VERSION
    };
    
    await cache.put('/offline-queue', 
      new Response(JSON.stringify(queueData), {
        headers: { 'Content-Type': 'application/json' }
      })
    );
  } catch (error) {
    console.error('❌ Failed to save offline queue:', error);
  }
}

// Queue offline action for later sync
async function queueOfflineAction(request) {
  if (offlineQueue.length >= MAX_QUEUE_SIZE) {
    // Remove oldest items if queue is full
    offlineQueue.splice(0, 10);
  }
  
  const action = {
    id: Date.now() + Math.random(),
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: await request.text(),
    timestamp: new Date().toISOString(),
    retryCount: 0
  };
  
  offlineQueue.push(action);
  await saveOfflineQueue();
  
  console.log('📝 Queued offline action:', action.method, action.url);
}

// Get offline API response
async function getOfflineApiResponse(pathname) {
  const offlineResponses = {
    '/api/user/profile': {
      id: 'offline-user',
      name: 'Offline User',
      email: 'offline@sovereign.local',
      status: 'Working offline',
      lastSeen: new Date().toISOString()
    },
    '/api/documents/recent': {
      documents: [
        { id: 1, name: 'Cached Document 1.pdf', type: 'Bill Discharge', cached: true },
        { id: 2, name: 'Cached Document 2.pdf', type: 'Affidavit', cached: true }
      ],
      offline: true,
      message: 'Showing cached documents only'
    },
    '/api/notifications': {
      notifications: [
        {
          id: 'offline-1',
          type: 'info',
          message: 'You are currently working offline. Some features may be limited.',
          timestamp: new Date().toISOString()
        }
      ]
    },
    '/api/settings': {
      theme: 'dark',
      notifications: true,
      offlineMode: true,
      lastSync: new Date().toISOString()
    }
  };
  
  const offlineData = offlineResponses[pathname];
  
  if (offlineData) {
    return new Response(JSON.stringify(offlineData), {
      headers: { 
        'Content-Type': 'application/json',
        'X-Served-From-Cache': 'true',
        'X-Offline-Response': 'true'
      }
    });
  }
  
  return new Response(JSON.stringify({
    error: 'No offline data available',
    message: 'This resource requires an internet connection',
    offline: true
  }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}

// ===========================================
// BACKGROUND SYNC
// ===========================================

self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case 'cornell-legal-sync':
      event.waitUntil(syncCornellLegalUpdates());
      break;
    case 'offline-actions-sync':
      event.waitUntil(processSyncQueue());
      break;
    case 'periodic-sync':
      event.waitUntil(performPeriodicSync());
      break;
    default:
      console.log('⚠️ Unknown sync tag:', event.tag);
  }
});

// Sync Cornell legal updates
async function syncCornellLegalUpdates() {
  console.log('⚖️ Syncing Cornell legal updates in background');
  
  try {
    const response = await fetch('/api/cornell-legal/updates');
    if (response.ok) {
      const updates = await response.json();
      
      const cache = await caches.open(CORNELL_LEGAL_CACHE);
      let updatedCount = 0;
      
      for (const update of updates) {
        await cache.put(
          `/cornell-legal/${update.id}`,
          new Response(JSON.stringify({
            ...update,
            syncedAt: new Date().toISOString(),
            version: SW_VERSION
          }), {
            headers: { 
              'Content-Type': 'application/json',
              'X-Synced-At': new Date().toISOString()
            }
          })
        );
        updatedCount++;
      }
      
      console.log(`✅ Synced ${updatedCount} legal updates successfully`);
      
      // Notify clients
      notifyClients({
        type: 'SYNC_COMPLETE',
        syncType: 'cornell-legal',
        updatedCount,
        success: true
      });
      
    }
  } catch (error) {
    console.error('❌ Failed to sync Cornell legal updates:', error);
  }
}

// Process offline sync queue
async function processSyncQueue() {
  if (offlineQueue.length === 0) {
    console.log('📭 Offline queue is empty');
    return;
  }
  
  console.log(`🔄 Processing ${offlineQueue.length} offline actions`);
  
  const processedItems = [];
  const failedItems = [];
  
  for (let i = 0; i < offlineQueue.length; i++) {
    const action = offlineQueue[i];
    
    try {
      const response = await fetch(action.url, {
        method: action.method,
        headers: action.headers,
        body: action.method !== 'GET' ? action.body : undefined
      });
      
      if (response.ok) {
        processedItems.push(action.id);
        console.log('✅ Synced offline action:', action.method, action.url);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
      
    } catch (error) {
      console.error('❌ Failed to sync action:', action.id, error);
      action.retryCount++;
      
      if (action.retryCount >= 3) {
        failedItems.push(action.id);
        console.log('❌ Giving up on action after 3 retries:', action.id);
      }
    }
  }
  
  // Remove processed and permanently failed items
  offlineQueue = offlineQueue.filter(
    action => !processedItems.includes(action.id) && !failedItems.includes(action.id)
  );
  
  await saveOfflineQueue();
  
  // Notify clients of sync results
  if (processedItems.length > 0 || failedItems.length > 0) {
    notifyClients({
      type: 'SYNC_COMPLETE',
      syncType: 'offline-actions',
      processed: processedItems.length,
      failed: failedItems.length,
      remaining: offlineQueue.length,
      success: true
    });
  }
}

// Periodic background sync
async function performPeriodicSync() {
  console.log('⏰ Performing periodic sync');
  
  // Update critical caches
  await Promise.all([
    syncCornellLegalUpdates(),
    processSyncQueue(),
    updateCriticalCache()
  ]);
}

// Update critical cache resources
async function updateCriticalCache() {
  try {
    const cache = await caches.open(API_CACHE);
    
    for (const endpoint of API_ENDPOINTS) {
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          await cache.put(endpoint, response);
        }
      } catch (error) {
        console.log(`⚠️ Failed to update cache for ${endpoint}:`, error);
      }
    }
    
    console.log('🔄 Critical cache updated');
  } catch (error) {
    console.error('❌ Failed to update critical cache:', error);
  }
}

// ===========================================
// PUSH NOTIFICATIONS
// ===========================================

self.addEventListener('push', (event) => {
  console.log('🔔 Push notification received');
  
  let notificationData = {
    title: 'Sovereign Legal Platform',
    body: 'New legal update available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'sovereign-legal-notification',
    vibrate: [100, 50, 100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: Date.now().toString()
    },
    actions: [
      {
        action: 'view',
        title: '👁️ View Details',
        icon: '/icons/view.png'
      },
      {
        action: 'dismiss',
        title: '❌ Dismiss',
        icon: '/icons/dismiss.png'
      }
    ]
  };
  
  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = {
        ...notificationData,
        ...pushData,
        data: {
          ...notificationData.data,
          ...pushData.data
        }
      };
    } catch (error) {
      console.error('❌ Failed to parse push data:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Enhanced notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notification clicked:', event.action);
  
  event.notification.close();
  
  const notificationData = event.notification.data || {};
  
  let targetUrl = '/';
  
  switch (event.action) {
    case 'view':
      targetUrl = notificationData.url || '/?notification=view';
      break;
    case 'dismiss':
      // Just close, no navigation
      return;
    default:
      // Default click (no action button)
      targetUrl = notificationData.url || '/?notification=default';
  }
  
  // Handle notification click
  event.waitUntil(
    clients.matchAll({ 
      type: 'window',
      includeUncontrolled: true 
    }).then(clientList => {
      // Try to focus existing window
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      
      // Open new window if no existing window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ===========================================
// MESSAGE HANDLING
// ===========================================

self.addEventListener('message', (event) => {
  console.log('📨 Message received from client:', event.data);
  
  const { type, data } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_CACHE_STATUS':
      handleGetCacheStatus(event);
      break;
      
    case 'CLEAR_CACHE':
      handleClearCache(event);
      break;
      
    case 'FORCE_SYNC':
      handleForceSync(event);
      break;
      
    case 'QUEUE_ACTION':
      handleQueueAction(event, data);
      break;
      
    default:
      console.log('⚠️ Unknown message type:', type);
  }
});

// Handle cache status request
async function handleGetCacheStatus(event) {
  try {
    const cacheNames = await caches.keys();
    const status = {
      caches: cacheNames,
      offlineQueueSize: offlineQueue.length,
      version: SW_VERSION,
      timestamp: new Date().toISOString()
    };
    
    event.ports[0].postMessage({ success: true, data: status });
  } catch (error) {
    event.ports[0].postMessage({ success: false, error: error.message });
  }
}

// Handle clear cache request
async function handleClearCache(event) {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    
    // Clear offline queue
    offlineQueue = [];
    await saveOfflineQueue();
    
    event.ports[0].postMessage({ 
      success: true, 
      message: 'All caches cleared successfully' 
    });
  } catch (error) {
    event.ports[0].postMessage({ success: false, error: error.message });
  }
}

// Handle force sync request
async function handleForceSync(event) {
  try {
    await Promise.all([
      processSyncQueue(),
      syncCornellLegalUpdates(),
      updateCriticalCache()
    ]);
    
    event.ports[0].postMessage({ 
      success: true, 
      message: 'Force sync completed successfully' 
    });
  } catch (error) {
    event.ports[0].postMessage({ success: false, error: error.message });
  }
}

// Handle queue action request
async function handleQueueAction(event, actionData) {
  try {
    const mockRequest = new Request(actionData.url, {
      method: actionData.method || 'POST',
      headers: actionData.headers || {},
      body: actionData.body
    });
    
    await queueOfflineAction(mockRequest);
    
    event.ports[0].postMessage({ 
      success: true, 
      message: 'Action queued successfully' 
    });
  } catch (error) {
    event.ports[0].postMessage({ success: false, error: error.message });
  }
}

// ===========================================
// UTILITIES
// ===========================================

// Notify all clients
function notifyClients(message) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage(message);
    });
  });
}

// Update network status
function updateNetworkStatus() {
  const wasOnline = isOnline;
  isOnline = navigator.onLine;
  
  if (wasOnline !== isOnline) {
    console.log(`🌐 Network status changed: ${isOnline ? 'online' : 'offline'}`);
    
    if (isOnline) {
      // Process queue when back online
      processSyncQueue();
    }
    
    notifyClients({
      type: 'NETWORK_STATUS_CHANGED',
      isOnline,
      timestamp: new Date().toISOString()
    });
  }
}

// Periodic network check
setInterval(updateNetworkStatus, 30000); // Check every 30 seconds

// ===========================================
// INITIALIZATION COMPLETE
// ===========================================

console.log(`✅ Sovereign Legal PWA Service Worker ${SW_VERSION} loaded successfully`);
console.log('🔧 Features enabled: Advanced Caching, Cornell Legal Knowledge, Offline Sync, Push Notifications');

// Initial status update
updateNetworkStatus();