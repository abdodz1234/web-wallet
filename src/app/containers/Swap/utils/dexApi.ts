import { invokeContract, processInvokeData, createInternalAppAPI } from '@app/core/api';
import { DEX_CID, DEX_APP_URL, DEX_APP_NAME } from './dexConstants';

export interface DexPool {
  aid1: number;
  aid2: number;
  ctl: number;
  kind: number;
  tok1: number;
  tok2: number;
  lp_token: number;
}

export interface DexPredict {
  buy?: number;
  pay?: number;
  pay_raw?: number;
  fee_pool?: number;
  fee_dao?: number;
}

let ammWasmBytes: number[] | null = null;

async function loadAmmWasm(): Promise<number[]> {
  if (ammWasmBytes) return ammWasmBytes;
  const url = typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime.getURL('assets/amm.wasm') : '/assets/amm.wasm';
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch amm.wasm: ${response.statusText}`);
  const buffer = await response.arrayBuffer();
  ammWasmBytes = Array.from(new Uint8Array(buffer));
  return ammWasmBytes;
}

async function invokeRaw(args: string): Promise<{ shaderResult: any; rawData: any[] | null }> {
  await createInternalAppAPI(DEX_APP_URL, DEX_APP_NAME);
  const contract = await loadAmmWasm();
  const result = await invokeContract({
    args,
    contract,
    create_tx: false,
    appurl: DEX_APP_URL,
    appname: DEX_APP_NAME,
  });

  let shaderResult: any = null;
  if (result?.output && typeof result.output === 'string') {
    const parsed = JSON.parse(result.output);
    if (parsed.error) throw new Error(parsed.error);
    shaderResult = parsed;
  }

  return { shaderResult, rawData: result?.raw_data ?? null };
}

export async function loadDexPools(): Promise<DexPool[]> {
  const { shaderResult } = await invokeRaw(`action=pools_view,cid=${DEX_CID}`);
  return (shaderResult?.res ?? []) as DexPool[];
}

export interface TradeParams {
  aid1: number;
  aid2: number;
  kind: number;
  val1_buy: number;
  val2_pay: number;
}

// aid1 = asset you receive (TO), aid2 = asset you pay (FROM), val2_pay = amount paying
export async function predictDexTrade(params: TradeParams): Promise<DexPredict> {
  const {
    aid1, aid2, kind, val1_buy, val2_pay,
  } = params;
  const args = `action=pool_trade,aid1=${aid1},aid2=${aid2},kind=${kind},`
    + `val1_buy=${val1_buy || 0}, val2_pay=${val2_pay || 0},bPredictOnly=1,cid=${DEX_CID}`;
  const { shaderResult } = await invokeRaw(args);
  return (shaderResult?.res ?? {}) as DexPredict;
}

export async function executeDexTrade(params: TradeParams): Promise<string | undefined> {
  const {
    aid1, aid2, kind, val1_buy, val2_pay,
  } = params;
  const args = `action=pool_trade,aid1=${aid1},aid2=${aid2},kind=${kind},`
    + `val1_buy=${val1_buy || 0}, val2_pay=${val2_pay || 0},bPredictOnly=0,cid=${DEX_CID}`;
  const { rawData } = await invokeRaw(args);
  if (!rawData?.length) return undefined;
  const res = await processInvokeData(DEX_APP_URL, rawData);
  return res?.txid as string | undefined;
}
