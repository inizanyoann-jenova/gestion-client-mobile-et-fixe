'use client'

import { useRouter } from 'next/navigation'
import { getInitials, getAvatarColor } from '@/lib/utils/initials'
import { ContactForm } from './contact-form'
import type { Contact } from '@/lib/supabase/types'

interface ContactsSectionProps {
  contacts: Contact[]
  clientId: string
}

export function ContactsSection({ contacts, clientId }: ContactsSectionProps) {
  const router = useRouter()

  const handleDelete = async (contactId: string) => {
    if (!confirm('Supprimer ce contact ?')) return
    await fetch(`/api/clients/${clientId}/contacts/${contactId}`, {
      method: 'DELETE',
    })
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold">
          Contacts{' '}
          {contacts.length > 0 && (
            <span className="text-slate-400 font-normal text-sm">({contacts.length})</span>
          )}
        </h2>
        <ContactForm mode="create" clientId={clientId} />
      </div>

      {contacts.length === 0 && (
        <p className="text-slate-400 text-sm">Aucun contact renseigné</p>
      )}

      {contacts.map((contact) => (
        <div
          key={contact.id}
          className="bg-slate-800 rounded-xl p-3 flex items-center gap-3"
        >
          <div
            className={`${getAvatarColor(contact.nom)} w-10 h-10 rounded-full flex items-center justify-center shrink-0`}
          >
            <span className="text-white text-sm font-bold">
              {getInitials(contact.prenom, contact.nom)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-white text-sm font-medium">
                {contact.prenom} {contact.nom}
              </p>
              {contact.est_principal && (
                <span className="text-xs bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded">
                  Principal
                </span>
              )}
            </div>
            {contact.poste && (
              <p className="text-slate-400 text-xs truncate">{contact.poste}</p>
            )}
            {contact.telephone && (
              <a
                href={`tel:${contact.telephone}`}
                className="text-sky-400 text-xs block"
              >
                {contact.telephone}
              </a>
            )}
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="text-slate-400 text-xs truncate block"
              >
                {contact.email}
              </a>
            )}
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <ContactForm mode="edit" clientId={clientId} contact={contact} />
            <button
              onClick={() => handleDelete(contact.id)}
              className="text-slate-500 hover:text-red-400 text-xs transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
