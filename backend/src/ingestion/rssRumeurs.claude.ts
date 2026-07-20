import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import type { Probabilite } from '../types.js';

// Haiku suffit largement pour cette tâche d'extraction courte et peu ambiguë
// (voir discussion sur le coût) — pas besoin d'un modèle plus capable ici.
const MODELE = 'claude-haiku-4-5';

const SchemaExtraction = z.object({
  estTransfert: z.boolean(),
  joueur: z.string().nullable(),
  clubDepart: z.string().nullable(),
  clubArrivee: z.string().nullable(),
  probabilite: z.enum(['LOW', 'MEDIUM', 'HIGH']).nullable(),
});

export interface ExtractionRumeur {
  estTransfert: boolean;
  joueur: string | null;
  clubDepart: string | null;
  clubArrivee: string | null;
  probabilite: Probabilite | null;
}

const SYSTEM_PROMPT = `Tu analyses un article de presse sportive (titre + extrait) pour savoir s'il rapporte une rumeur ou confirmation de transfert de football précise et individuelle.

Réponds estTransfert=false si l'article n'est pas centré sur un transfert précis d'un joueur nommé (actualité générale, blessure, résultat de match, analyse tactique, transfert déjà ancien évoqué en passant, rumeur trop vague sans joueur nommé).

Si estTransfert=true : indique le nom du joueur, le club de départ et le club d'arrivée tels que mentionnés dans le texte (nom de club en anglais tel qu'écrit dans l'article, ne traduis pas), et une probabilité selon le langage de l'article :
- LOW : simple rumeur/intérêt rapporté ("linked with", "keeping tabs on", "admirer of")
- MEDIUM : contact ou discussions confirmées ("in talks", "opened discussions", "bid submitted")
- HIGH : accord proche ou imminent ("medical scheduled", "here we go", "deal agreed", "set to sign", "confirmed")

Si le club de départ ou d'arrivée n'est pas clair dans le texte, mets null plutôt que de deviner.`;

export function isClaudeActif(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

let client: Anthropic | undefined;
function getClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

export async function extraireRumeur(titre: string, extrait: string): Promise<ExtractionRumeur | undefined> {
  const response = await getClient().messages.parse({
    model: MODELE,
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `Titre : ${titre}\nExtrait : ${extrait}` }],
    output_config: { format: zodOutputFormat(SchemaExtraction) },
  });
  return response.parsed_output ?? undefined;
}
