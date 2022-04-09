export interface Source {
  description: string;
  fullName: string;
  id: SourceId;
  name: string;
  shortName: string;
}

export enum SourceId {
  Abnewswire = 'abnewswire',
  AccesswirePr = 'accesswire_pr',
  AcnnewswireStory = 'acnnewswire_story',
  BusinesswireStory = 'businesswire_story',
  BzPrThomsonReuters = 'bz_pr_thomson_reuters',
  Bzsignals = 'bzsignals',
  ComtexStory = 'comtex_story',
  GlobenewswireStory = 'globenewswire_story',
  HtfMarketIntelligence = 'htf_market_intelligence',
  IamnewswirePr = 'iamnewswire_pr',
  Jijipress = 'jijipress',
  MarketwireStory = 'marketwire_story',
  NetworknewswirePr = 'networknewswire_pr',
  NewsfileStory = 'newsfile_story',
  NewswirePr = 'newswire_pr',
  NewswireStory = 'newswire_story',
  PrSecfilings = 'pr_secfilings',
  PrStory = 'pr_story',
  PressReleases = 'pressReleases',
  PrwebStory = 'prweb_story',
  ScoutfinRealtimebriefs = 'scoutfin_realtimebriefs',
  Story = 'story',
  SyndicatedLinks = 'syndicated_links',
  WebwireStory = 'webwire_story',
  WiredRelease = 'wired_release',
}
