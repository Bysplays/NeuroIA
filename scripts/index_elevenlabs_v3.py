"""Validate v3 recordings and split word lists only when every pause is unambiguous."""
import json
import hashlib
from pathlib import Path
import soundfile as sf
import numpy as np

folder = Path(__file__).resolve().parents[1] / 'public/audio/elevenlabs-v3'
items = json.loads((folder/'texts.json').read_text())
blocks = json.loads((folder/'blocks.json').read_text())
records = {x['id']:dict(x, status='pending') for x in items}
issues = []

def read(file):
    audio, rate = sf.read(file)
    if not len(audio) or not np.isfinite(audio).all() or not np.any(audio):
        raise ValueError(f'Invalid recording: {file}')
    return audio, rate

def register(item, file, source, extra=None):
    audio, rate = read(file)
    if len(item['text']) > 30 and len(audio)/rate < 1.2:
        raise ValueError(f'Redownload incomplete sentence from History: {file.name}')
    records[item['id']].update(status='generated', file=file.name, source=source,
        seconds=round(len(audio)/rate,3), sha256=hashlib.sha256(file.read_bytes()).hexdigest(),
        review='needs-listening', **(extra or {}))

def split_words(block, file):
    audio, rate = read(file)
    mono = audio.mean(axis=1) if audio.ndim>1 else audio
    step = max(1, round(rate*.01))
    rms = np.array([np.sqrt(np.mean(mono[i:i+step]**2)) for i in range(0,len(mono),step)])
    active = rms > .008
    spans = []
    start = None
    for i, on in enumerate(active):
        if on and start is None:
            start = i
        if start is not None and (not on or i==len(active)-1):
            end = i+1 if on else i
            if spans and start-spans[-1][1]<30:
                spans[-1][1] = end
            else:
                spans.append([start,end])
            start = None
    if len(spans)!=len(block['items']):
        issues.append({'block':block['id'],'expected':len(block['items']),'detected':len(spans)})
        return
    for item,(start,end) in zip(block['items'],spans):
        left=max(0,start*step-round(.09*rate))
        right=min(len(audio),end*step+round(.14*rate))
        dest=folder/(item['id']+'.wav')
        sf.write(dest,audio[left:right],rate,subtype='PCM_16')
        register(item,dest,file.name,{'start':left/rate,'end':right/rate})

approved_words=['Taza','Zapato','Tijeras','Cepillo','Bicicleta','Girasol']
approved={'id':'approved-words','items':[next(x for x in items if x['text']==w) for w in approved_words]}
split_words(approved,folder/'approved-words.mp3')
for block in blocks:
    file=folder/(block['id']+'.mp3')
    if not file.exists():continue
    if block['id'].startswith('words-'):split_words(block,file)
    else:register(block['items'][0],file,file.name)
for item in items:
    if item['text'] in ['Taza.','Zapato.']:
        source=next(x for x in records.values() if x['text']==item['text'][:-1])
        records[item['id']].update({k:v for k,v in source.items() if k not in ['id','text','group']})
manifest={'provider':'ElevenLabs','voice':'Alejandro Castellanos','voiceId':'WWVK6dYMrl0ZHnHT7cRj',
          'model':'eleven_v3','languageOverride':'es','stability':.5,
          'license':'Free-plan non-commercial evaluation; attribute elevenlabs.io.',
          'items':list(records.values()),'segmentationIssues':issues}
(folder/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(folder/'pending.json').write_text(json.dumps([x for x in records.values() if x['status']=='pending'], ensure_ascii=False, indent=2)+'\n')
print({'generated':sum(x['status']=='generated' for x in records.values()),'total':len(items),'segmentationIssues':issues})

# Compact runtime lookup: pending recordings never point to missing assets.
lookup = {x['text'].strip().lower(): x['file'] for x in records.values() if x['status']=='generated'}
(folder.parents[2]/'src/services/speechRecordings.json').write_text(json.dumps(lookup, ensure_ascii=False, indent=2)+'\n')
