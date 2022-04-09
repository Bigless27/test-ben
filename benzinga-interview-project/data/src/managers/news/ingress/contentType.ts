import { SafeError, SafeType } from '@benzinga/safe-await';
import { Source, SourceId } from '../entities';
import { StringNumber } from '../../../entities';

export type PressReleaseId = SourceId;

export interface IncomingSource {
  description: string;
  full_name: string;
  name: string;
  short_name: string;
  type: SourceId;
}

export type PressRelease = PressReleaseId;

interface IncomingTaxonomy {
  description: string;
  help: string;
  hierarchy: '0' | '1';
  module: string;
  multiple: '0' | '1';
  name: 'Channels';
  nodes: Record<SourceId, SourceId>;
  relations: '0' | '1';
  required: '0' | '1';
  tags: '0' | '1';
  vid: StringNumber;
}

interface IncomingTaxonomies {
  [vid: number]: IncomingTaxonomy;
}

interface Term {
  depth: number;
  description: string;
  name: string;
  parents: number[];
  tid: number;
  vid: number;
  weight: number;
}

interface IncomingTerms {
  1: Term[];
  12: Term[];
  15: Term[];
}

export interface ContentTypesForPro {
  pr_types: PressRelease[];
  taxonomies: IncomingTaxonomies;
  terms: IncomingTerms;
  types: IncomingSource[];
}

export const ingresSources = (ingressSource: ContentTypesForPro): SafeType<Source[]> => {
  if (ingressSource?.types) {
    return {
      result: Object.values(ingressSource.types).map(Source => ({
        description: Source.description,
        fullName: Source.full_name,
        id: Source.type,
        name: Source.name,
        shortName: Source.short_name,
      })),
    };
  } else {
    return { err: new SafeError('did not get a valid Source', 'invalid_Source') };
  }
};

export const ingresPressReleases = (ingressSource: ContentTypesForPro): SafeType<PressRelease[]> => {
  if (ingressSource?.types) {
    return { result: ingressSource.pr_types };
  } else {
    return { err: new SafeError('did not get a valid Source', 'invalid_Source') };
  }
};
