const itemsEndpoint = '/items';
const itemById = (id) => `${itemsEndpoint}/${id}`;

const fetchBtn = document.getElementById('fetch-btn');
const itemsContainer = document.getElementById('items');
const addForm = document.getElementById('add-form');
const addName = document.getElementById('add-name');
const addQuantity = document.getElementById('add-quantity');
const statusEl = document.getElementById('status');
const modalEl = document.getElementById('modal');
const modalCloseBtn = document.getElementById('modal-close');
const modalMethod = document.getElementById('modal-method');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-description');
const modalStatusLine = document.getElementById('modal-status-line');
const modalStatusInfo = document.getElementById('modal-status-info');
const modalStatusBlock = document.getElementById('modal-status-block');
const modalSize = document.getElementById('modal-size');
const modalRequest = document.getElementById('modal-request');
const modalResponse = document.getElementById('modal-response');
const modalHeaders = document.getElementById('modal-headers');
const modalMore = document.getElementById('modal-more');
const modalMoreBtn = document.getElementById('modal-more-btn');
const modalImageWrapper = document.getElementById('modal-image-wrapper');
const modalImage = document.getElementById('modal-image');
const textEncoder = new TextEncoder();
const trigger400Btn = document.getElementById('trigger-400');
const trigger401Btn = document.getElementById('trigger-401');
const trigger403Btn = document.getElementById('trigger-403');
const trigger404Btn = document.getElementById('trigger-404');
const trigger500Btn = document.getElementById('trigger-500');
const trigger502Btn = document.getElementById('trigger-502');
const trigger503Btn = document.getElementById('trigger-503');
const trigger418Btn = document.getElementById('trigger-418');
const headersToArray = (headers) => {
  if (!headers) return [];
  if (headers instanceof Headers) {
    return Array.from(headers.entries());
  }
  if (Array.isArray(headers)) {
    return headers;
  }
  if (typeof headers === 'object') {
    return Object.entries(headers);
  }
  return [];
};

const showStatus = (message, isError = false) => {
    statusEl.textContent = message;
    statusEl.style.color = isError ? '#c0392b' : '#0b8457';
};

const serializePayload = (payload) => {
    if (payload === undefined || payload === null || payload === '') {
        return '';
    }
    if (Array.isArray(payload)) {
        return payload.length ? JSON.stringify(payload, null, 2) : '[]';
    }
    if (typeof payload === 'object') {
        return Object.keys(payload).length ? JSON.stringify(payload, null, 2) : '';
    }
    return String(payload);
};

const formatPayload = (payload) => {
  const serialized = serializePayload(payload);
  return serialized === '' ? '—' : serialized;
};

const formatHeadersBlock = (headers) => {
  const entries = headersToArray(headers);
  if (!entries.length) {
    return '—';
  }
  return entries.map(([key, value]) => `${key}: ${value}`).join('\n');
};

const payloadBytes = (payload) => {
    const serialized = serializePayload(payload);
    if (serialized === '') {
        return 0;
    }

    try {
        return textEncoder.encode(serialized).length;
    } catch (error) {
        return serialized.length;
    }
};

const explainStatus = (status, isError) => {
    const map = {
        200: 'Alles okay – die Anfrage war erfolgreich.',
        201: 'Erstellt – der Server hat eine neue Ressource angelegt.',
        204: 'Kein Inhalt – erfolgreiche Aktion ohne Response-Body.',
        400: 'Ungültige Client-Anfrage: Pflichtfelder oder Datentypen verletzen das Schema.',
        401: 'Nicht autorisiert: Ressource verlangt gültige Authentifizierung vom Client.',
        403: 'Verboten: Authentifizierter Client besitzt keine Berechtigung für diese Ressource.',
        404: 'Nicht gefunden: Unter der URI existiert keine Ressource.',
        418: 'RFC 2324 Status – demonstriert den Umgang mit nicht standardisierten Codes.',
        500: 'Interner Serverfehler – ungefangene Exception.',
        502: 'Bad Gateway – Upstream-Service lieferte eine ungültige Antwort.',
        503: 'Service Unavailable – Dienst temporär nicht erreichbar.',
    };
    if (map[status]) {
        return map[status];
    }
    if (!status) {
        return isError ? 'Kein Status verfügbar – eventuell Netzwerkfehler.' : 'Status unbekannt.';
    }
    return isError ? 'Fehler laut HTTP-Status.' : 'HTTP-Status laut Spezifikation.';
};

const closeModal = () => {
  modalEl.setAttribute('hidden', '');
  modalEl.classList.remove('flex');
  document.body.style.overflow = '';
};

const openModal = ({
  method,
  status,
  statusText,
  title,
  subtitle,
  requestBody,
  responseBody,
  headers,
  isError = false,
  showStatusMeta = true,
  image,
}) => {
  modalMethod.textContent = method || '-';
  modalTitle.textContent = title || 'Aktion';
  modalDesc.textContent = subtitle || '';
  modalStatusLine.textContent = explainStatus(status, isError);
  modalStatusInfo.textContent = status ? `${status} ${statusText || ''}`.trim() : '';
  if (modalStatusBlock) {
    if (showStatusMeta) {
      modalStatusBlock.classList.remove('hidden');
    } else {
      modalStatusBlock.classList.add('hidden');
    }
  }
  modalHeaders.textContent = formatHeadersBlock(headers);
  const requestText = formatPayload(requestBody);
  const responseText = formatPayload(responseBody);
  modalRequest.textContent = requestText;
  modalResponse.textContent = responseText;
  const reqBytes = payloadBytes(requestBody);
  const resBytes = payloadBytes(responseBody);
  modalSize.textContent = `Req ${reqBytes} B · Res ${resBytes} B`;
  if (modalImageWrapper && modalImage) {
    if (image && image.src) {
      modalImageWrapper.classList.remove('hidden');
      modalImage.src = image.src;
      modalImage.alt = image.alt || 'Status Illustration';
    } else {
      modalImageWrapper.classList.add('hidden');
      modalImage.src = '';
    }
  }
  modalEl.removeAttribute('hidden');
  modalEl.classList.add('flex');
  setMoreVisibility(false);
    document.body.style.overflow = 'hidden';
};

modalCloseBtn.addEventListener('click', closeModal);
modalEl.addEventListener('click', (event) => {
    if (event.target === modalEl) {
        closeModal();
    }
});
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modalEl.getAttribute('hidden') === null) {
        closeModal();
    }
});

const fetchItems = async ({ withModal = false } = {}) => {
  try {
    const res = await fetch(itemsEndpoint);
    const responseHeaders = headersToArray(res.headers);
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      const err = new Error(errorBody.error || `Artikel konnten nicht geladen werden (${res.status})`);
      err.meta = {
        method: 'GET',
        url: itemsEndpoint,
        status: res.status,
        statusText: res.statusText,
        responseBody: errorBody,
        headers: responseHeaders,
      };
      throw err;
    }
    const { items = [] } = await res.json();
        renderItems(items);
        showStatus('Artikel geladen');
        if (withModal) {
            openModal({
                method: 'GET',
                url: itemsEndpoint,
                status: res.status,
        statusText: res.statusText,
        title: 'GET /items',
        subtitle: 'Alle Artikel wurden erfolgreich aus dem Speicher geladen.',
        responseBody: items,
        headers: responseHeaders,
      });
    }
  } catch (error) {
        showStatus(error.message, true);
        if (withModal || error.meta) {
            openModal({
                method: error.meta?.method || 'GET',
                url: error.meta?.url || itemsEndpoint,
                status: error.meta?.status,
        statusText: error.meta?.statusText,
        title: 'Fehler bei GET /items',
        subtitle: error.message,
        responseBody: error.meta?.responseBody,
        headers: error.meta?.headers || [],
        isError: true,
      });
        }
    }
};

const addItem = async (name, quantity) => {
  try {
    const res = await fetch(itemsEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, quantity }),
    });
    const responseHeaders = headersToArray(res.headers);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const err = new Error(data.error || 'Artikel konnte nicht angelegt werden');
      err.meta = {
        method: 'POST',
        url: itemsEndpoint,
        status: res.status,
        statusText: res.statusText,
        requestBody: { name, quantity },
        responseBody: data,
        headers: responseHeaders,
      };
      throw err;
    }
    const payload = await res.json();
        showStatus('Artikel hinzugefügt');
        addForm.reset();
        openModal({
            method: 'POST',
            url: itemsEndpoint,
            status: res.status,
      statusText: res.statusText,
      title: 'POST /items',
      subtitle: 'Neuer Artikel wurde gespeichert.',
      requestBody: { name, quantity },
      responseBody: payload,
      headers: responseHeaders,
    });
        fetchItems();
    } catch (error) {
        showStatus(error.message, true);
        openModal({
            method: error.meta?.method || 'POST',
            url: error.meta?.url || itemsEndpoint,
            status: error.meta?.status,
      statusText: error.meta?.statusText,
      title: 'Fehler bei POST /items',
      subtitle: error.message,
      requestBody: error.meta?.requestBody,
      responseBody: error.meta?.responseBody,
      headers: error.meta?.headers || [],
      isError: true,
    });
    }
};

const updateItem = async (id, name, quantity) => {
  try {
    const endpoint = itemById(id);
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, quantity }),
    });
    const responseHeaders = headersToArray(res.headers);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const err = new Error(data.error || 'Artikel konnte nicht aktualisiert werden');
      err.meta = {
        method: 'PUT',
        url: endpoint,
        status: res.status,
        statusText: res.statusText,
        requestBody: { name, quantity },
        responseBody: data,
        headers: responseHeaders,
      };
      throw err;
    }
        const payload = await res.json();
        showStatus('Artikel aktualisiert');
        openModal({
            method: 'PUT',
            url: endpoint,
            status: res.status,
            statusText: res.statusText,
      title: `PUT /items/${id}`,
      subtitle: 'Artikel wurde erfolgreich angepasst.',
      requestBody: { name, quantity },
      responseBody: payload,
      headers: responseHeaders,
    });
        fetchItems();
    } catch (error) {
        showStatus(error.message, true);
        openModal({
            method: error.meta?.method || 'PUT',
      url: error.meta?.url || endpoint,
            status: error.meta?.status,
            statusText: error.meta?.statusText,
      title: `Fehler bei PUT /items/${id}`,
      subtitle: error.message,
      requestBody: error.meta?.requestBody,
      responseBody: error.meta?.responseBody,
      headers: error.meta?.headers || [],
      isError: true,
    });
    }
};

const deleteItem = async (id) => {
  try {
    const endpoint = itemById(id);
    const res = await fetch(endpoint, {
      method: 'DELETE',
    });
    const responseHeaders = headersToArray(res.headers);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const err = new Error(data.error || 'Artikel konnte nicht gelöscht werden');
      err.meta = {
        method: 'DELETE',
        url: endpoint,
        status: res.status,
        statusText: res.statusText,
        responseBody: data,
        headers: responseHeaders,
      };
      throw err;
    }
        const payload = await res.json();
        showStatus('Artikel gelöscht');
        openModal({
            method: 'DELETE',
            url: endpoint,
            status: res.status,
            statusText: res.statusText,
      title: `DELETE /items/${id}`,
      subtitle: 'Artikel wurde entfernt.',
      responseBody: payload,
      headers: responseHeaders,
    });
        fetchItems();
    } catch (error) {
        showStatus(error.message, true);
        openModal({
            method: error.meta?.method || 'DELETE',
      url: error.meta?.url || endpoint,
            status: error.meta?.status,
      statusText: error.meta?.statusText,
      title: `Fehler bei DELETE /items/${id}`,
      subtitle: error.message,
      responseBody: error.meta?.responseBody,
      headers: error.meta?.headers || [],
      isError: true,
    });
    }
};

const renderItems = (items) => {
    itemsContainer.innerHTML = '';
    if (!items.length) {
        const emptyState = document.createElement('p');
        emptyState.textContent = 'Noch keine Artikel vorhanden.';
        emptyState.className = 'text-sm text-slate-500 italic';
        itemsContainer.appendChild(emptyState);
        return;
    }

    items.forEach((item) => {
        const card = document.createElement('div');
        card.className =
            'flex flex-wrap items-center gap-4 rounded-2xl border border-white bg-white/95 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)]';

        const idBadge = document.createElement('span');
        idBadge.textContent = `#${item.id}`;
        idBadge.className = 'text-xs font-semibold uppercase tracking-widest text-slate-500';

        const nameLabel = document.createElement('label');
        nameLabel.textContent = 'Name';
        nameLabel.className =
            'flex min-w-[160px] flex-1 flex-col gap-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-slate-500';
        const nameInput = document.createElement('input');
        nameInput.value = item.name;
        nameInput.className =
            'rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-300';
        nameLabel.appendChild(nameInput);

        const qtyLabel = document.createElement('label');
        qtyLabel.textContent = 'Anzahl';
        qtyLabel.className =
            'flex min-w-[120px] flex-col gap-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-slate-500';
        const qtyInput = document.createElement('input');
        qtyInput.type = 'number';
        qtyInput.value = item.quantity;
        qtyInput.className =
            'rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-300';
        qtyLabel.appendChild(qtyInput);

        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'flex gap-2';

        const updateBtn = document.createElement('button');
        updateBtn.textContent = 'PUT';
        updateBtn.className =
            'rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow hover:bg-indigo-700 transition';
        updateBtn.addEventListener('click', () => {
            updateItem(item.id, nameInput.value.trim(), Number(qtyInput.value));
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'DELETE';
        deleteBtn.className =
            'rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow hover:bg-rose-600 transition';
        deleteBtn.addEventListener('click', () => deleteItem(item.id));

        buttonGroup.appendChild(updateBtn);
        buttonGroup.appendChild(deleteBtn);

        card.appendChild(idBadge);
        card.appendChild(nameLabel);
        card.appendChild(qtyLabel);
        card.appendChild(buttonGroup);

        itemsContainer.appendChild(card);
    });
};

fetchBtn.addEventListener('click', () => fetchItems({ withModal: true }));

addForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = addName.value.trim();
    const quantity = Number(addQuantity.value);
    if (!name || Number.isNaN(quantity)) {
        showStatus('Name und Anzahl sind erforderlich', true);
        return;
    }
    addItem(name, quantity);
});

const triggerBadRequest = async () => {
  const invalidBody = { name: '', quantity: null };
  try {
    const res = await fetch(itemsEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidBody),
    });
    const responseHeaders = headersToArray(res.headers);
    const payload = await res.json().catch(() => ({}));
    if (res.ok) {
      showStatus('Unerwartet: Server hat die 400-Demo akzeptiert.');
      openModal({
        method: 'POST',
        url: itemsEndpoint,
        status: res.status,
        statusText: res.statusText,
        title: 'POST /items (Demo)',
        subtitle: 'Demo sendet absichtlich falsche Daten – hier wurde nichts abgelehnt.',
        requestBody: invalidBody,
        responseBody: payload,
        headers: responseHeaders,
        showStatusMeta: false,
      });
      return;
    }
    showStatus('400-Demo ausgelöst');
    openModal({
      method: 'POST',
      url: itemsEndpoint,
      status: res.status,
      statusText: res.statusText,
      title: '400 BAD REQUEST',
      subtitle: 'Ungültige Client-Anfrage: Pflichtfelder oder Datentypen verletzen das Schema.',
      requestBody: invalidBody,
      responseBody: payload,
      headers: responseHeaders,
      showStatusMeta: false,
      isError: true,
    });
  } catch (error) {
        showStatus(error.message, true);
        openModal({
            method: 'POST',
            url: itemsEndpoint,
      title: 'Fehler bei 400-Demo',
      subtitle: error.message,
      requestBody: invalidBody,
      headers: [],
      showStatusMeta: false,
      isError: true,
    });
    }
};

const triggerUnauthorized = async () => {
  const endpoint = `${itemsEndpoint}?simulate=unauthorized`;
  try {
    const res = await fetch(endpoint);
    const responseHeaders = headersToArray(res.headers);
    const payload = await res.json().catch(() => ({}));
    if (res.ok) {
      showStatus('Unerwartet: 401-Demo lieferte Erfolg.');
      openModal({
        method: 'GET',
        url: endpoint,
        status: res.status,
        statusText: res.statusText,
        title: 'GET /items (Demo)',
        subtitle: 'Demo ohne Authentifizierung – hier unerwartet erfolgreich.',
        responseBody: payload,
        headers: responseHeaders,
        showStatusMeta: false,
      });
      return;
    }
    showStatus('401-Demo ausgelöst');
    openModal({
      method: 'GET',
      url: endpoint,
      status: res.status,
      statusText: res.statusText,
      title: '401 UNAUTHORIZED',
      subtitle: 'Nicht autorisiert: Ressource verlangt gültige Authentifizierung vom Client.',
      responseBody: payload,
      headers: responseHeaders,
      showStatusMeta: false,
      isError: true,
    });
  } catch (error) {
        showStatus(error.message, true);
        openModal({
            method: 'GET',
            url: endpoint,
      title: 'Fehler bei 401-Demo',
      subtitle: error.message,
      headers: [],
      showStatusMeta: false,
      isError: true,
    });
  }
};

const triggerForbidden = async () => {
  const endpoint = `${itemsEndpoint}?simulate=forbidden`;
  try {
    const res = await fetch(endpoint);
    const responseHeaders = headersToArray(res.headers);
    const payload = await res.json().catch(() => ({}));
    if (res.ok) {
      showStatus('Unerwartet: 403-Demo lieferte Erfolg.');
      openModal({
        method: 'GET',
        url: endpoint,
        status: res.status,
        statusText: res.statusText,
        title: 'GET /items (Demo)',
        subtitle: 'Demo mit Benutzer ohne Rechte – hier unerwartet erfolgreich.',
        responseBody: payload,
        headers: responseHeaders,
        showStatusMeta: false,
      });
      return;
    }
    showStatus('403-Demo ausgelöst');
    openModal({
      method: 'GET',
      url: endpoint,
      status: res.status,
      statusText: res.statusText,
      title: '403 FORBIDDEN',
      subtitle: 'Verboten: Authentifizierter Client besitzt keine Berechtigung für diese Ressource.',
      responseBody: payload,
      headers: responseHeaders,
      showStatusMeta: false,
      isError: true,
    });
  } catch (error) {
        showStatus(error.message, true);
        openModal({
            method: 'GET',
            url: endpoint,
      title: 'Fehler bei 403-Demo',
      subtitle: error.message,
      headers: [],
      showStatusMeta: false,
      isError: true,
    });
  }
};

const triggerNotFound = async () => {
  const endpoint = itemById(999999);
  try {
    const res = await fetch(endpoint, { method: 'DELETE' });
    const responseHeaders = headersToArray(res.headers);
    const payload = await res.json().catch(() => ({}));
    if (res.ok) {
      showStatus('Unerwartet: 404-Demo lieferte Erfolg.');
      openModal({
        method: 'DELETE',
        url: endpoint,
        status: res.status,
        statusText: res.statusText,
        title: 'DELETE (Demo)',
        subtitle: 'DELETE auf ID 999999 – hier sollte eigentlich ein 404 kommen.',
        responseBody: payload,
        headers: responseHeaders,
        showStatusMeta: false,
        image: {
          src: 'img/404-placeholder.png',
          alt: '404 Illustration',
          caption: 'Demo-Illustration: ID 999999 existiert nicht.',
        },
      });
      return;
    }
    showStatus('404-Demo ausgelöst');
    openModal({
      method: 'DELETE',
      url: endpoint,
      status: res.status,
      statusText: res.statusText,
      title: '404 NOT FOUND',
      subtitle: 'Nicht gefunden: Unter der URI existiert keine Ressource.',
      responseBody: payload,
      headers: responseHeaders,
      showStatusMeta: false,
      image: {
        src: 'img/404-placeholder.png',
        alt: '404 Illustration',
        caption: 'Demo 404: Ressource wurde nicht gefunden.',
      },
      isError: true,
    });
  } catch (error) {
        showStatus(error.message, true);
        openModal({
            method: 'DELETE',
            url: endpoint,
      title: 'Fehler bei 404-Demo',
      subtitle: error.message,
      headers: [],
      showStatusMeta: false,
      image: {
        src: 'img/404-placeholder.png',
        alt: '404 Illustration',
        caption: 'Demo 404 meldete einen Fehler.',
      },
      isError: true,
    });
  }
};

const triggerServerError = async () => {
  const endpoint = `${itemsEndpoint}?simulate=server-error`;
  try {
    const res = await fetch(endpoint);
    const responseHeaders = headersToArray(res.headers);
    const payload = await res.json().catch(() => ({}));
    if (res.ok) {
      showStatus('Unerwartet: 500-Demo lieferte Erfolg.');
            openModal({
                method: 'GET',
                url: endpoint,
                status: res.status,
                statusText: res.statusText,
        title: 'GET /items (Demo)',
        subtitle: 'Demo triggert eine ungefangene Ausnahme – hier trat sie nicht auf.',
        responseBody: payload,
        headers: responseHeaders,
        showStatusMeta: false,
      });
      return;
    }
        showStatus('500-Demo ausgelöst');
        openModal({
            method: 'GET',
            url: endpoint,
            status: res.status,
      statusText: res.statusText,
      title: '500 INTERNAL SERVER ERROR',
      subtitle: 'Interner Serverfehler – ungefangene Exception.',
      responseBody: payload,
      headers: responseHeaders,
      showStatusMeta: false,
      isError: true,
    });
  } catch (error) {
        showStatus(error.message, true);
        openModal({
            method: 'GET',
            url: endpoint,
      title: 'Fehler bei 500-Demo',
      subtitle: error.message,
      headers: [],
      showStatusMeta: false,
      isError: true,
    });
  }
};

const triggerBadGateway = async () => {
  const endpoint = `${itemsEndpoint}?simulate=bad-gateway`;
  try {
    const res = await fetch(endpoint);
    const responseHeaders = headersToArray(res.headers);
    const payload = await res.json().catch(() => ({}));
    if (res.ok) {
      showStatus('Unerwartet: 502-Demo lieferte Erfolg.');
            openModal({
                method: 'GET',
                url: endpoint,
                status: res.status,
                statusText: res.statusText,
        title: 'GET /items (Demo)',
        subtitle: 'Gateway-Demo sollte versagen – hier nicht passiert.',
        responseBody: payload,
        headers: responseHeaders,
        showStatusMeta: false,
      });
      return;
    }
        showStatus('502-Demo ausgelöst');
        openModal({
            method: 'GET',
            url: endpoint,
            status: res.status,
      statusText: res.statusText,
      title: '502 BAD GATEWAY',
      subtitle: 'Bad Gateway – Upstream-Service lieferte eine ungültige Antwort.',
      responseBody: payload,
      headers: responseHeaders,
      showStatusMeta: false,
      isError: true,
    });
  } catch (error) {
        showStatus(error.message, true);
        openModal({
            method: 'GET',
            url: endpoint,
      title: 'Fehler bei 502-Demo',
      subtitle: error.message,
      headers: [],
      showStatusMeta: false,
      isError: true,
    });
  }
};

const triggerServiceUnavailable = async () => {
  const endpoint = `${itemsEndpoint}?simulate=service-unavailable`;
  try {
    const res = await fetch(endpoint);
    const responseHeaders = headersToArray(res.headers);
    const payload = await res.json().catch(() => ({}));
    if (res.ok) {
      showStatus('Unerwartet: 503-Demo lieferte Erfolg.');
            openModal({
                method: 'GET',
                url: endpoint,
                status: res.status,
                statusText: res.statusText,
        title: 'GET /items (Demo)',
        subtitle: 'Wartungs-Demo sollte 503 liefern – hier erfolgreich.',
        responseBody: payload,
        headers: responseHeaders,
        showStatusMeta: false,
      });
      return;
    }
        showStatus('503-Demo ausgelöst');
        openModal({
            method: 'GET',
            url: endpoint,
            status: res.status,
      statusText: res.statusText,
      title: '503 SERVICE UNAVAILABLE',
      subtitle: 'Service Unavailable – Dienst temporär nicht erreichbar.',
      responseBody: payload,
      headers: responseHeaders,
      showStatusMeta: false,
      isError: true,
    });
  } catch (error) {
        showStatus(error.message, true);
        openModal({
            method: 'GET',
            url: endpoint,
      title: 'Fehler bei 503-Demo',
      subtitle: error.message,
      headers: [],
      showStatusMeta: false,
      isError: true,
    });
  }
};

const triggerTeapot = async () => {
  const endpoint = `${itemsEndpoint}?simulate=teapot`;
  try {
    const res = await fetch(endpoint);
    const responseHeaders = headersToArray(res.headers);
    const payload = await res.json().catch(() => ({}));
    if (res.ok) {
      showStatus('Unerwartet: 418-Demo lieferte Erfolg.');
      openModal({
        method: 'GET',
        url: endpoint,
        status: res.status,
        statusText: res.statusText,
        title: 'GET /items (Demo)',
        subtitle: 'Teapot-Demo sollte 418 liefern – hier erfolgreich.',
        responseBody: payload,
        headers: responseHeaders,
        showStatusMeta: false,
      });
      return;
    }
    showStatus("418-Demo ausgelöst – Zeit für 'I'm a teapot'!");
    openModal({
      method: 'GET',
      url: endpoint,
      status: res.status,
      statusText: res.statusText,
      title: "418 I'M A TEAPOT",
      subtitle: 'Legendärer RFC-Status (418), war ein Aprilscherz von 1998. wird tatsächlich von einigen APIs als easterEgg verwendet.',
      responseBody: payload,
      headers: responseHeaders,
      showStatusMeta: false,
      isError: true,
    });
  } catch (error) {
    showStatus(error.message, true);
    openModal({
      method: 'GET',
      url: endpoint,
      title: 'Fehler bei 418-Demo',
      subtitle: error.message,
      headers: [],
      showStatusMeta: false,
      isError: true,
    });
  }
};

trigger400Btn.addEventListener('click', triggerBadRequest);
trigger401Btn.addEventListener('click', triggerUnauthorized);
trigger403Btn.addEventListener('click', triggerForbidden);
trigger404Btn.addEventListener('click', triggerNotFound);
trigger500Btn.addEventListener('click', triggerServerError);
trigger502Btn.addEventListener('click', triggerBadGateway);
trigger503Btn.addEventListener('click', triggerServiceUnavailable);
trigger418Btn.addEventListener('click', triggerTeapot);

// Load initial state
fetchItems();
const setMoreVisibility = (visible) => {
  if (!modalMore || !modalMoreBtn) return;
  if (visible) {
    modalMore.classList.remove('hidden');
    modalMoreBtn.textContent = 'Weniger anzeigen';
    modalMoreBtn.setAttribute('aria-expanded', 'true');
  } else {
    modalMore.classList.add('hidden');
    modalMoreBtn.textContent = 'Mehr anzeigen';
    modalMoreBtn.setAttribute('aria-expanded', 'false');
  }
};

if (modalMoreBtn) {
  modalMoreBtn.addEventListener('click', () => {
    if (!modalMore) return;
    const isVisible = !modalMore.classList.contains('hidden');
    setMoreVisibility(!isVisible);
  });
}
