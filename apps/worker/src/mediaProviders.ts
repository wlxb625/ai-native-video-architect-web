export interface ProviderConfig {
  provider: string;
  baseUrl?: string;
  model?: string;
  apiKey?: string;
}

export interface MediaGenerationInput {
  mediaType: 'image' | 'video';
  operation: string;
  prompt: string;
  negativePrompt?: string;
  provider?: string;
  model?: string;
  inputAssetIds?: string[];
  inputUrls?: string[];
  parameters?: Record<string, any>;
}

export interface MediaProviderResult {
  mediaType: 'image' | 'video';
  operation: string;
  status: string;
  title: string;
  summary: string;
  previewUrl: string | null;
  base64?: string | null;
  model?: string;
  provider?: string;
  externalJobId?: string | null;
  raw?: unknown;
}

const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function cleanBaseUrl(value: string) {
  return value.replace(/\/$/, '');
}

function ratioToRunway(ratio = '16:9', mediaType: 'image' | 'video') {
  const video: Record<string, string> = {
    '16:9': '1280:720',
    '9:16': '720:1280',
  };
  const image: Record<string, string> = {
    '16:9': '1920:1080',
    '9:16': '1080:1920',
    '1:1': '1080:1080',
    '4:3': '1440:1080',
    '3:4': '1080:1440',
    '21:9': '1808:768',
  };
  return (mediaType === 'video' ? video : image)[ratio] ?? (mediaType === 'video' ? '1280:720' : '1920:1080');
}

function ratioToOpenAISize(ratio = '16:9') {
  const values: Record<string, string> = {
    '16:9': '1536x1024',
    '9:16': '1024x1536',
    '1:1': '1024x1024',
    '4:3': '1536x1024',
    '3:4': '1024x1536',
    '21:9': '1536x1024',
  };
  return values[ratio] ?? '1536x1024';
}

async function checkedJson(response: Response, label: string) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof body?.error?.message === 'string' ? body.error.message : JSON.stringify(body).slice(0, 500);
    throw new Error(`${label} returned ${response.status}: ${message}`);
  }
  return body as any;
}

async function fetchBlob(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to fetch input media: ${response.status}`);
  return response.blob();
}

async function openAIImage(
  input: MediaGenerationInput,
  provider: ProviderConfig,
): Promise<MediaProviderResult> {
  const baseUrl = cleanBaseUrl(provider.baseUrl!);
  const model = input.model || provider.model || 'gpt-image-1';
  const parameters = input.parameters ?? {};
  const inputUrls = input.inputUrls ?? [];
  const isEdit = input.operation !== 'text-to-image';
  let response: Response;

  if (!isEdit) {
    response = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt: input.prompt,
        n: Number(parameters.variants ?? 1),
        size: parameters.size || ratioToOpenAISize(parameters.ratio),
        quality: parameters.quality === 'draft' ? 'low' : parameters.quality || 'auto',
        background: parameters.background || 'auto',
        output_format: parameters.outputFormat || 'webp',
      }),
    });
  } else {
    if (inputUrls.length < 1) {
      return {
        mediaType: 'image',
        operation: input.operation,
        status: 'input-upload-required',
        title: '图片输入尚未上传',
        summary: '图生图需要把画布输入素材上传到对象存储，并向 Provider 发送真实图片文件。',
        previewUrl: null,
        model,
        provider: provider.provider,
      };
    }
    const form = new FormData();
    form.set('model', model);
    form.set('prompt', input.prompt);
    form.set('n', String(Number(parameters.variants ?? 1)));
    form.set('size', parameters.size || ratioToOpenAISize(parameters.ratio));
    form.set('quality', parameters.quality === 'draft' ? 'low' : parameters.quality || 'auto');
    form.set('background', parameters.background || 'auto');
    form.set('output_format', parameters.outputFormat || 'webp');
    form.set('input_fidelity', parameters.inputFidelity || 'high');
    for (const [index, url] of inputUrls.entries()) {
      const blob = await fetchBlob(url);
      form.append('image[]', blob, `input-${index}.${blob.type.split('/')[1] || 'png'}`);
    }
    response = await fetch(`${baseUrl}/images/edits`, {
      method: 'POST',
      headers: { authorization: `Bearer ${provider.apiKey}` },
      body: form,
    });
  }

  const body = await checkedJson(response, 'Image provider');
  const first = body.data?.[0] ?? body.output?.[0] ?? body;
  return {
    mediaType: 'image',
    operation: input.operation,
    status: 'generated',
    title: input.operation === 'text-to-image' ? '文生图候选 V1' : '图生图候选 V1',
    summary: '图片 Provider 已返回生成结果。',
    previewUrl: first.url ?? first.image_url ?? null,
    base64: first.b64_json ?? null,
    model,
    provider: provider.provider,
    raw: body,
  };
}

async function runwayTask(
  input: MediaGenerationInput,
  provider: ProviderConfig,
): Promise<MediaProviderResult> {
  const baseUrl = cleanBaseUrl(provider.baseUrl!);
  const model = input.model || provider.model || (input.mediaType === 'video' ? 'gen4.5' : 'gen4_image');
  const parameters = input.parameters ?? {};
  const inputUrls = input.inputUrls ?? [];
  let endpoint = '';
  let body: Record<string, unknown> = {};

  if (input.operation === 'text-to-video') {
    endpoint = '/v1/text_to_video';
    body = {
      model,
      promptText: input.prompt,
      ratio: ratioToRunway(parameters.ratio, 'video'),
      duration: Number(parameters.durationSeconds ?? 5),
      seed: parameters.seed || undefined,
    };
  } else if (input.operation === 'image-to-video' || input.operation === 'first-last-frame-video') {
    if (!inputUrls[0]) {
      return {
        mediaType: 'video',
        operation: input.operation,
        status: 'input-upload-required',
        title: '首帧尚未上传',
        summary: 'Runway 图生视频要求可访问的图片 URL 或上传 URI。',
        previewUrl: null,
        model,
        provider: provider.provider,
      };
    }
    endpoint = '/v1/image_to_video';
    body = {
      model,
      promptImage: inputUrls[0],
      promptText: input.prompt,
      ratio: ratioToRunway(parameters.ratio, 'video'),
      duration: Number(parameters.durationSeconds ?? 5),
      seed: parameters.seed || undefined,
      ...(input.operation === 'first-last-frame-video' && inputUrls[1]
        ? { lastFrame: inputUrls[1] }
        : {}),
    };
  } else if (['text-to-image', 'image-to-image', 'multi-reference-image'].includes(input.operation)) {
    endpoint = '/v1/text_to_image';
    body = {
      model,
      promptText: input.prompt,
      ratio: ratioToRunway(parameters.ratio, 'image'),
      referenceImages: inputUrls.map((uri) => ({ uri })),
      seed: parameters.seed || undefined,
    };
  } else if (input.operation === 'video-to-video') {
    if (!inputUrls[0]) {
      return {
        mediaType: 'video', operation: input.operation, status: 'input-upload-required',
        title: '输入视频尚未上传', summary: '视频转视频需要一个可访问的视频 URL。',
        previewUrl: null, model, provider: provider.provider,
      };
    }
    endpoint = '/v1/video_to_video';
    body = { model, videoUri: inputUrls[0], promptText: input.prompt };
  } else {
    return {
      mediaType: input.mediaType,
      operation: input.operation,
      status: 'adapter-required',
      title: '当前 Runway Adapter 尚未覆盖该操作',
      summary: `尚未实现 ${input.operation} 的 Runway 请求映射。`,
      previewUrl: null,
      model,
      provider: provider.provider,
    };
  }

  const createResponse = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${provider.apiKey}`,
      'X-Runway-Version': '2024-11-06',
    },
    body: JSON.stringify(body),
  });
  const created = await checkedJson(createResponse, 'Runway');
  const taskId = created.id;
  if (!taskId) throw new Error('Runway did not return a task id');

  for (let attempt = 0; attempt < 150; attempt += 1) {
    await sleep(2000);
    const taskResponse = await fetch(`${baseUrl}/v1/tasks/${taskId}`, {
      headers: {
        authorization: `Bearer ${provider.apiKey}`,
        'X-Runway-Version': '2024-11-06',
      },
    });
    const task = await checkedJson(taskResponse, 'Runway task');
    if (task.status === 'SUCCEEDED') {
      return {
        mediaType: input.mediaType,
        operation: input.operation,
        status: 'generated',
        title: input.mediaType === 'video' ? '视频候选 V1' : '图片候选 V1',
        summary: 'Runway 任务已完成。',
        previewUrl: task.output?.[0] ?? task.outputUrl ?? null,
        model,
        provider: provider.provider,
        externalJobId: taskId,
        raw: task,
      };
    }
    if (['FAILED', 'CANCELED'].includes(task.status)) {
      throw new Error(`Runway task ${task.status}: ${task.failure ?? task.failureCode ?? 'unknown error'}`);
    }
  }
  throw new Error('Runway task timed out');
}

async function lumaTask(
  input: MediaGenerationInput,
  provider: ProviderConfig,
): Promise<MediaProviderResult> {
  const baseUrl = cleanBaseUrl(provider.baseUrl!);
  const model = input.model || provider.model || (input.mediaType === 'video' ? 'ray-2' : 'photon-1');
  const parameters = input.parameters ?? {};
  const inputUrls = input.inputUrls ?? [];
  const isImage = input.mediaType === 'image';
  const endpoint = isImage ? '/dream-machine/v1/generations/image' : '/dream-machine/v1/generations';
  const body: Record<string, unknown> = {
    prompt: input.prompt,
    model,
    aspect_ratio: parameters.ratio || '16:9',
  };

  if (isImage && input.operation !== 'text-to-image') {
    if (!inputUrls[0]) {
      return {
        mediaType: 'image', operation: input.operation, status: 'input-upload-required',
        title: '参考图片尚未上传', summary: 'Luma 图片参考需要可访问的 CDN URL。',
        previewUrl: null, model, provider: provider.provider,
      };
    }
    body.image_ref = inputUrls.map((url) => ({ url, weight: Number(parameters.strength ?? 0.8) }));
  }

  if (!isImage) {
    body.duration = `${Number(parameters.durationSeconds ?? 5)}s`;
    body.resolution = parameters.resolution || '720p';
    body.loop = Boolean(parameters.loop ?? false);
    if (input.operation === 'image-to-video' || input.operation === 'first-last-frame-video') {
      if (!inputUrls[0]) {
        return {
          mediaType: 'video', operation: input.operation, status: 'input-upload-required',
          title: '首帧尚未上传', summary: 'Luma 图生视频需要可访问的首帧 URL。',
          previewUrl: null, model, provider: provider.provider,
        };
      }
      body.keyframes = {
        frame0: { type: 'image', url: inputUrls[0] },
        ...(input.operation === 'first-last-frame-video' && inputUrls[1]
          ? { frame1: { type: 'image', url: inputUrls[1] } }
          : {}),
      };
    }
    if (input.operation === 'video-extend') {
      return {
        mediaType: 'video', operation: input.operation, status: 'generation-id-required',
        title: '视频延长需要原始 generation ID',
        summary: 'Luma 延长视频不能只使用 MP4 URL，需要保存原视频的 Luma generation ID。',
        previewUrl: null, model, provider: provider.provider,
      };
    }
  }

  const createResponse = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify(body),
  });
  const created = await checkedJson(createResponse, 'Luma');
  const taskId = created.id;
  if (!taskId) throw new Error('Luma did not return a generation id');

  for (let attempt = 0; attempt < 180; attempt += 1) {
    await sleep(2000);
    const taskResponse = await fetch(`${baseUrl}/dream-machine/v1/generations/${taskId}`, {
      headers: { authorization: `Bearer ${provider.apiKey}` },
    });
    const task = await checkedJson(taskResponse, 'Luma generation');
    if (task.state === 'completed') {
      return {
        mediaType: input.mediaType,
        operation: input.operation,
        status: 'generated',
        title: input.mediaType === 'video' ? '视频候选 V1' : '图片候选 V1',
        summary: 'Luma 任务已完成。',
        previewUrl: task.assets?.video ?? task.assets?.image ?? null,
        model,
        provider: provider.provider,
        externalJobId: taskId,
        raw: task,
      };
    }
    if (task.state === 'failed') throw new Error(`Luma task failed: ${task.failure_reason ?? 'unknown error'}`);
  }
  throw new Error('Luma generation timed out');
}

export async function executeMediaProvider(
  input: MediaGenerationInput,
  provider: ProviderConfig,
): Promise<MediaProviderResult> {
  if (!provider.baseUrl || !provider.apiKey) {
    return {
      mediaType: input.mediaType,
      operation: input.operation,
      status: 'provider-required',
      title: input.mediaType === 'video' ? '视频 Provider 未配置' : '图片 Provider 未配置',
      summary: '请在参数侧栏配置对应的 Agent、图片或视频 Provider。',
      previewUrl: null,
      model: input.model || provider.model,
      provider: provider.provider,
    };
  }

  const kind = `${input.provider ?? ''} ${provider.provider} ${provider.baseUrl}`.toLowerCase();
  if (kind.includes('runway')) return runwayTask(input, provider);
  if (kind.includes('luma')) return lumaTask(input, provider);
  if (input.mediaType === 'image') return openAIImage(input, provider);

  return {
    mediaType: 'video',
    operation: input.operation,
    status: 'video-adapter-required',
    title: '请为视频 Provider 选择 Runway 或 Luma Adapter',
    summary: '视频接口并不统一。当前内置 Runway 与 Luma 映射；其他平台需要独立 Adapter。',
    previewUrl: null,
    model: input.model || provider.model,
    provider: provider.provider,
  };
}
