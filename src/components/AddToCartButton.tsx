import axios from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addCartItem, cartQueryKey, cartQuoteQueryKey } from '../lib/cart'
import type { Cart } from '../types/cart'
import { useNavigate } from '@tanstack/react-router'

type AddToCartButtonProps = {
  nftId: string
  editionId: string
  quantity: number
  disabled?: boolean
  label?: string
}

export function AddToCartButton({
  nftId,
  editionId,
  quantity,
  disabled = false,
  label = 'COMPRAR',
}: AddToCartButtonProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const mutation = useMutation({
    mutationFn: addCartItem,
    retry: false,
    scope: { id: 'cart' },

    onSuccess: async (cart) => {
      await queryClient.cancelQueries({
        queryKey: cartQueryKey,
      })

      queryClient.setQueryData<Cart>(cartQueryKey, (previous) =>
        previous && previous.version > cart.version ? previous : cart,
      )

      await queryClient.invalidateQueries({
        queryKey: cartQuoteQueryKey,
      })

      await navigate({ to: '/cart' })
    },

    onError: () => {
      void queryClient.invalidateQueries({
        queryKey: cartQueryKey,
      })
    },
  })

  const errorMessage =
    axios.isAxiosError<{ message: string }>(mutation.error)
      ? mutation.error.response?.data.message ??
        'Não foi possível atualizar o carrinho.'
      : 'Não foi possível atualizar o carrinho.'

  return (
    <div className="mt-6">
      <button
        type="button"
        disabled={disabled || mutation.isPending}
        onClick={() =>
          mutation.mutate({ nftId, editionId, quantity })
        }
        className="rounded bg-brand px-8 py-3 text-sm font-bold text-page hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {mutation.isPending ? 'ADICIONANDO…' : label}
      </button>

      {mutation.isError && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {errorMessage}
        </p>
      )}

      {mutation.isSuccess && (
        <p role="status" className="mt-3 text-sm text-subtle">
          NFT adicionado ao carrinho.
        </p>
      )}
    </div>
  )
}

