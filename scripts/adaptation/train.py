"""Reproducible PPO engineering model. All trajectories are SIMULATED, not patients.

This environment tests difficulty control mechanics. Its reward/response equations
are hypotheses, not a clinical model. A real pilot and scientific protocol are
required before production activation or claims about benefit/attention/fatigue.
"""
import argparse
import hashlib
import json
from pathlib import Path
import gymnasium as gym
import numpy as np
import torch
from stable_baselines3 import PPO

ROOT = Path(__file__).resolve().parents[2]
GAMES = ['visual-scanning', 'language-naming', 'word-completion', 'memory-path', 'memory-pairs', 'categorization', 'motor-target', 'motor-tracking']
CHANNELS = ['TP9', 'AF7', 'AF8', 'TP10']
BANDS = ['delta', 'theta', 'alpha', 'beta', 'gamma']
FEATURES = [f'game:{game}' for game in GAMES] + ['level', 'errorRate', 'errorDelta', 'latencyTrend', 'hintRate', 'responseMask', 'contactRatio', 'trackingMask']
FEATURES += [f'{channel}:{band}Delta' for channel in CHANNELS for band in BANDS] + [f'{channel}:valid' for channel in CHANNELS]


class SimulatedPractice(gym.Env):
    observation_space = gym.spaces.Box(-1, 1, (len(FEATURES),), dtype=np.float32)
    action_space = gym.spaces.Discrete(3)  # down, hold, up

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        self.level = int(self.np_random.integers(1, 11))
        self.ability = self.np_random.uniform(1, 10)
        self.game = int(self.np_random.integers(8))
        self.steps = 0
        self.previous_error = 0
        self.previous_latency = 1
        return self.observe(), {}

    def observe(self):
        # Bounded difficulty-response simulator. EEG is a nuisance covariate:
        # we intentionally assert no physiological meaning or efficacy relation.
        accuracy = float(np.clip(1/(1+np.exp((self.level-self.ability-2)/1.3)) + self.np_random.normal(0, .025), 0, 1))
        self.accuracy = accuracy
        latency = float(np.exp(np.clip((self.level-self.ability)/5, -1, 1)))
        tracking = self.game == 7
        vector = [float(i == self.game) for i in range(8)]
        vector += [(self.level-1)/9, 0 if tracking else 1-accuracy,
                   0 if tracking else (1-accuracy)-self.previous_error,
                   0 if tracking else float(np.clip(np.log2(latency/self.previous_latency)/2,-1,1)),
                   0 if tracking else float(self.np_random.random() < (1-accuracy)*.2),
                   float(not tracking), accuracy if tracking else 0, float(tracking)]
        masks = self.np_random.binomial(1,.5,size=4) if self.np_random.random() > .35 else np.zeros(4)
        vector += [float(self.np_random.uniform(-.2,.2)*mask) for mask in masks for _ in BANDS] + masks.tolist()
        self.previous_error = 1-accuracy
        self.previous_latency = latency
        return np.asarray(vector,dtype=np.float32)

    def step(self, action):
        previous = self.level
        self.level = int(np.clip(self.level+int(action)-1,1,10))
        self.ability = float(np.clip(self.ability+self.np_random.normal(0,.15),1,10))
        self.steps += 1
        observation = self.observe()
        # Engineering target only: avoid both trivial and persistently failed tasks.
        reward = 1 - 4*abs(self.accuracy-.8) - .025*abs(self.level-previous)
        return observation, reward, False, self.steps >= 40, {}


def evaluate(policy, seed, episodes=100):
    env = SimulatedPractice()
    rewards, deviations, changes = [], [], []
    for episode in range(episodes):
        obs, _ = env.reset(seed=seed+episode)
        total = deviation = changed = 0
        for _ in range(40):
            before = env.level
            action = policy(obs)
            obs, reward, _, _, _ = env.step(action)
            total += reward
            deviation += abs(env.accuracy-.8)
            changed += before != env.level
        rewards.append(total/40); deviations.append(deviation/40); changes.append(changed/40)
    return {'episodes':episodes,'meanReward':float(np.mean(rewards)),
            'meanAccuracyDeviation':float(np.mean(deviations)), 'changeFraction':float(np.mean(changes))}


def main():
    args=argparse.ArgumentParser()
    args.add_argument('--steps',type=int,default=131072)
    args.add_argument('--seed',type=int,default=20261004)
    args.add_argument('--output',type=Path,default=ROOT/'vendor/adaptation/generated')
    args=args.parse_args()
    torch.set_num_threads(1)
    torch.use_deterministic_algorithms(True)
    model=PPO('MlpPolicy',SimulatedPractice(),seed=args.seed,device='cpu',n_steps=1024,batch_size=64,
              n_epochs=5,learning_rate=.0003,gamma=.95,ent_coef=.01,
              policy_kwargs={'net_arch':{'pi':[32,32],'vf':[32,32]}},verbose=0)
    print(f'Training PPO on {args.steps} simulated task boundaries',flush=True)
    model.learn(total_timesteps=args.steps)
    args.output.mkdir(parents=True,exist_ok=True)
    model.save(args.output/'checkpoint')
    layers=[]
    for layer in [*model.policy.mlp_extractor.policy_net,model.policy.action_net]:
        if isinstance(layer,torch.nn.Linear):
            layers.append({'weights':layer.weight.detach().tolist(),'bias':layer.bias.detach().tolist(),'activation':'linear'})
        elif isinstance(layer,torch.nn.Tanh): layers[-1]['activation']='tanh'
        else: raise ValueError(f'Unsupported export layer {type(layer)}')
    digest=hashlib.sha256(json.dumps(layers,sort_keys=True,separators=(',',':')).encode()).hexdigest()
    artifact={'version':1,'id':f'ppo-sim-v1-{digest[:12]}','algorithm':'PPO','trainingData':'synthetic',
              'productionValidated':False,'seed':args.seed,'steps':model.num_timesteps,
              'featureNames':FEATURES,'games':GAMES,'channels':CHANNELS,'bands':BANDS,
              'actions':[-1,0,1],'layers':layers,'weightsSha256':digest,
              'trainingSourceSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
              'versions':{'torch':torch.__version__,'numpy':np.__version__,'stable-baselines3':__import__('stable_baselines3').__version__}}
    (args.output/'model.json').write_text(json.dumps(artifact,separators=(',',':'))+'\n')
    actor=lambda observation:int(model.predict(observation,deterministic=True)[0])
    baseline=lambda observation: 0 if (observation[14] if observation[15] else 1-observation[9]) < .7 else 2 if (observation[14] if observation[15] else 1-observation[9]) > .9 else 1
    metrics={name:evaluate(policy,args.seed+10000) for name,policy in [('ppo',actor),('hold',lambda _:1),('threshold',baseline)]}
    (args.output/'evaluation.json').write_text(json.dumps({'scope':'synthetic held-out seeds only','metrics':metrics},indent=2)+'\n')
    rng=np.random.default_rng(args.seed+20000)
    observations=[SimulatedPractice().reset(seed=args.seed+20000+i)[0] for i in range(100)]
    observations += [rng.uniform(-1,1,len(FEATURES)).astype(np.float32) for _ in range(100)]
    with torch.no_grad():
        tensors=torch.tensor(np.asarray(observations),dtype=torch.float32)
        logits=model.policy.action_net(model.policy.mlp_extractor.forward_actor(tensors)).tolist()
    vectors=[{'observation':obs.tolist(),'logits':logit,'action':int(np.argmax(logit))-1} for obs,logit in zip(observations,logits)]
    (args.output/'parity.json').write_text(json.dumps(vectors,separators=(',',':'))+'\n')
    print(json.dumps(metrics,indent=2),flush=True)


if __name__=='__main__': main()
