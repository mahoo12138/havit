import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Stack, uiStyles } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Dialog } from '../../components/ui/dialog-compat';
import { useToast } from '../../components/ui/use-toast';
import { virtualCredentialsApi, type VirtualCredential } from '../../api/client';

type DeletableCredential = Pick<VirtualCredential, 'id' | 'platform'> & { item_name?: string };

/**
 * Shared credential-deletion flow (confirm dialog with platform + item name,
 * toast, standard invalidation). Used by the /credentials page and the item
 * detail platform-credentials card on desktop and mobile.
 */
export function useCredentialDelete() {
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<{ credential: DeletableCredential; itemName?: string } | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (credentialId: string) => virtualCredentialsApi.remove(credentialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['virtual-credentials'] });
      queryClient.invalidateQueries({ queryKey: ['item'] });
      toast.show(t('credentials.credentialDeleted'));
      setDeleting(null);
    },
    onError: (error: Error) => toast.show(t('credentials.credentialDeleteFailed', { error: error.message })),
  });

  function requestDelete(credential: DeletableCredential, itemName?: string) {
    setDeleting({ credential, itemName });
  }

  const deleteDialog = deleting ? (
    <Dialog open title={t('credentials.deleteCredential')} onClose={() => setDeleting(null)}>
      <Stack>
        <p className={uiStyles.helpParagraph}>
          {t('credentials.deleteCredentialConfirm', {
            platform: deleting.credential.platform,
            item: deleting.itemName ?? deleting.credential.item_name ?? '',
          })}
        </p>
        <Button
          variant="destructive"
          onClick={() => deleteMutation.mutate(deleting.credential.id)}
          disabled={deleteMutation.isPending}
        >
          {t('common.delete')}
        </Button>
      </Stack>
    </Dialog>
  ) : null;

  return { requestDelete, deleteDialog };
}
