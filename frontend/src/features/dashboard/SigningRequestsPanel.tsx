'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, FileCheck2, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AffiliationFormState } from '@/core/interfaces/affiliation.interfaces';
import {
  deleteMyPendingSigningRequest,
  getMySigningRequest,
  getMySigningRequests,
  SellerSigningRequestItem,
  SellerSigningRequestStatus,
} from '@/core/services/signing-request.service';
import { PdfPreviewModal } from '@/features/affiliation/PdfPreviewModal';

interface SigningRequestsPanelProps {
  enabled: boolean;
}

const PAGE_LIMIT = 20;

const normalizeSearch = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

const statusClass = (status: SellerSigningRequestStatus) => {
  if (status === 'FIRMADO') return 'is-signed';
  if (status === 'PARCIALMENTE_FIRMADO') return 'is-partial';
  if (status === 'EXPIRADO') return 'is-expired';
  if (status === 'REVOCADO') return 'is-revoked';
  return 'is-pending';
};

export function SigningRequestsPanel({ enabled }: SigningRequestsPanelProps) {
  const t = useTranslations('dashboard');
  const [requests, setRequests] = useState<SellerSigningRequestItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedForm, setSelectedForm] = useState<AffiliationFormState | null>(null);

  const loadRequests = useCallback(async (offset = 0, refresh = false) => {
    if (!enabled) return;
    if (refresh) setRefreshing(true);
    else if (offset > 0) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const response = await getMySigningRequests(PAGE_LIMIT, offset);
      setRequests((current) => offset > 0 ? [...current, ...response.requests] : response.requests);
      setHasMore(response.hasMore);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('signingRequestsError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [enabled, t]);

  useEffect(() => {
    void loadRequests(0);
  }, [loadRequests]);

  const filteredRequests = useMemo(() => {
    const term = normalizeSearch(search);
    if (!term) return requests;
    return requests.filter((request) => normalizeSearch([
      request.holderName,
      request.documentType,
      request.documentNumber,
      request.caseFileNumber,
      request.status,
      request.email ?? '',
      ...request.signers.map((signer) => signer.name),
    ].join(' ')).includes(term));
  }, [requests, search]);

  const openDocument = async (request: SellerSigningRequestItem) => {
    if (request.signedCount === 0) return;
    setOpeningId(request.caseFileId);
    setError(null);
    setSuccess(null);
    try {
      const detail = await getMySigningRequest(request.caseFileId);
      setSelectedForm(detail.formData);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('signingRequestsError'));
    } finally {
      setOpeningId(null);
    }
  };

  const deletePendingRequest = async (request: SellerSigningRequestItem) => {
    if (request.status !== 'PENDIENTE_FIRMA' || request.signedCount > 0) return;
    const confirmed = window.confirm(t('signingRequestDeleteConfirm', {
      expediente: request.caseFileNumber,
      client: request.holderName,
    }));
    if (!confirmed) return;

    setDeletingId(request.caseFileId);
    setError(null);
    setSuccess(null);
    try {
      await deleteMyPendingSigningRequest(request.caseFileId);
      setRequests((current) => current.filter((item) => item.caseFileId !== request.caseFileId));
      setSuccess(t('signingRequestDeleteSuccess'));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('signingRequestDeleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (request: SellerSigningRequestItem) => new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(request.signedAt ?? request.sentAt ?? request.createdAt));

  return (
    <section className="previasis-card dashboard-signing-card">
      <div className="dashboard-signing-heading">
        <div className="dashboard-signing-title">
          <span className="dashboard-signing-title-icon"><FileCheck2 size={20} /></span>
          <div>
            <h3>{t('signingRequestsTitle')}</h3>
            <p>{t('signingRequestsSubtitle')}</p>
          </div>
        </div>
        <span className="pill-badge">{t('signingRequestsCount', { count: requests.length })}</span>
      </div>

      <div className="dashboard-signing-toolbar">
        <label className="dashboard-signing-search">
          <Search size={17} />
          <input
            className="previasis-input"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('signingRequestsSearch')}
            aria-label={t('signingRequestsSearch')}
          />
        </label>
        <button
          type="button"
          className="btn-pill btn-pill-secondary"
          onClick={() => void loadRequests(0, true)}
          disabled={loading || refreshing}
        >
          <RefreshCw size={15} className={refreshing ? 'spin' : undefined} />
          {t('signingRequestsRefresh')}
        </button>
      </div>

      {error && <div className="client-signing-error" role="alert">{error}</div>}
      {success && <div className="dashboard-signing-success" role="status">{success}</div>}

      {loading ? (
        <div className="dashboard-signing-empty">{t('signingRequestsLoading')}</div>
      ) : filteredRequests.length === 0 ? (
        <div className="dashboard-signing-empty">
          {requests.length === 0 ? t('signingRequestsEmpty') : t('signingRequestsNoResults')}
        </div>
      ) : (
        <>
          <div className="dashboard-signing-table-wrap">
            <table className="dashboard-signing-table">
              <thead>
                <tr>
                  <th>{t('signingRequestFile')}</th>
                  <th>{t('signingRequestClient')}</th>
                  <th>{t('signingRequestStatus')}</th>
                  <th>{t('signingRequestProgress')}</th>
                  <th>{t('signingRequestDate')}</th>
                  <th>{t('signingRequestActions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.caseFileId}>
                    <td>
                      <span className="dashboard-signing-file">
                        <strong>{request.caseFileNumber}</strong>
                        <span>{request.caseFileId.slice(0, 8)}</span>
                      </span>
                    </td>
                    <td>
                      <span className="dashboard-signing-client">
                        <strong>{request.holderName}</strong>
                        <span>{request.documentType}-{request.documentNumber}</span>
                      </span>
                    </td>
                    <td>
                      <span className={`dashboard-signing-status ${statusClass(request.status)}`}>
                        {t(`signingStatuses.${request.status}`)}
                      </span>
                    </td>
                    <td>{t('signingRequestSignedProgress', { signed: request.signedCount, total: request.signerCount })}</td>
                    <td>{formatDate(request)}</td>
                    <td>
                      {request.signedCount > 0 ? (
                        <button
                          type="button"
                          className="btn-pill btn-pill-secondary"
                          onClick={() => void openDocument(request)}
                          disabled={openingId === request.caseFileId}
                          title={t('signingRequestView')}
                        >
                          <Eye size={15} />
                          {openingId === request.caseFileId
                            ? t('signingRequestLoadingDocument')
                            : t('signingRequestView')}
                        </button>
                      ) : request.status === 'PENDIENTE_FIRMA' ? (
                        <button
                          type="button"
                          className="btn-pill dashboard-signing-delete"
                          onClick={() => void deletePendingRequest(request)}
                          disabled={deletingId === request.caseFileId}
                          title={t('signingRequestDelete')}
                        >
                          <Trash2 size={15} />
                          {deletingId === request.caseFileId
                            ? t('signingRequestDeleting')
                            : t('signingRequestDelete')}
                        </button>
                      ) : (
                        <span className="dashboard-signing-pending">{t('signingRequestPendingDocument')}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hasMore && (
            <div className="dashboard-signing-pagination">
              <button
                type="button"
                className="btn-pill btn-pill-secondary"
                onClick={() => void loadRequests(requests.length)}
                disabled={loadingMore}
              >
                {loadingMore ? t('signingRequestsLoadingMore') : t('signingRequestsLoadMore')}
              </button>
            </div>
          )}
        </>
      )}

      {selectedForm && (
        <PdfPreviewModal
          isOpen
          mode="final"
          formData={selectedForm}
          onClose={() => setSelectedForm(null)}
        />
      )}
    </section>
  );
}
