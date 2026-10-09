# hux

hux is a personal assistant for a household that runs across many devices, each with different ways to hear, show and speak. This glossary fixes the words we use for its parts.

## System shape

**Gateway**:
The single coordinating instance of hux for a household: it holds the household's data, settings and secrets, and is the only part that reaches the internet.
_Avoid_: server, hub, brain, backend

**Node**:
Any device or program connected to a Gateway that lets members talk to hux or lets hux show, say or do something there.
_Avoid_: client, satellite, agent, endpoint

**Connector**:
A Node without its own hardware that bridges an outside channel (a messenger, an email inbox, a voice platform) into hux.
_Avoid_: channel adapter, bridge

**Capability profile**:
The declaration a Node makes of what it can take in and put out: its modalities, Surfaces, sensors and hosted services.
_Avoid_: device info, features

**Surface**:
One place on a Node where output can be perceived: a monitor, a browser tab, a phone screen, a speaker.
_Avoid_: display, screen, output, page

**Pairing**:
The act by which a Member admits a new Node to a Gateway and establishes trust in both directions.
_Avoid_: registration, login, enrolment

## Surfaces and widgets

**Widget**:
One piece of generated UI that hux places on a Surface, such as a recipe, a timer or a week of calendar.
_Avoid_: card, window, panel, tile

**Kept widget**:
A Widget a Member asked to keep; it stays on its Surface until someone removes it.
_Avoid_: pinned, persistent, sticky

**Passing widget**:
A Widget that answers the moment and goes away on its own or when dismissed.
_Avoid_: transient, temporary, ephemeral

**Layout**:
A named arrangement of Widgets on a Surface that a Member saved and can bring back, such as "cooking screen".
_Avoid_: dashboard, scene, page, view, preset

## People and presence

**Household**:
The set of Members served by one Gateway; the unit of trust.
_Avoid_: tenant, organisation, account

**Member**:
A person in a Household, with their own identity, memory, private items and approvals.
_Avoid_: user, account, profile

**Presence**:
hux's current belief about which Member is where, and which Surfaces they can perceive, with a confidence.
_Avoid_: location, occupancy

**Presence observation**:
A single piece of evidence about Presence from one source, such as a voice heard by a Node or a car arriving home.
_Avoid_: presence event, signal

**Place**:
A named location Presence can refer to: the home, a room within it, or a zone outside it such as work or the supermarket.
_Avoid_: area, zone, geofence, room (when the general term is meant)

**Focus**:
What a Member is currently looking at or working on at a Node, used to understand "this", "here" and "that".
_Avoid_: active window, selection, context

## Agents and work

**Role**:
An isolated agent within hux with its own SOUL, memory, permitted tools, permitted data and model choice.
_Avoid_: agent, persona, bot, assistant

**SOUL**:
A Role's identity: who it is, what it values and how it works.
_Avoid_: system prompt, persona, character

**Chief**:
The Role every Member talks to directly; it plans and delegates to other Roles.
_Avoid_: main agent, orchestrator, front agent

**Team**:
A group of Roles led by one Role that may delegate to them, such as a product owner leading engineers and designers.
_Avoid_: crew, swarm, squad

**Delegation**:
A Role handing a Task to another Role below it, with permissions no wider than its own.
_Avoid_: handoff, sub-agent call

**Task**:
A unit of work owned by one Role, with a state and a result.
_Avoid_: job, ticket, run

**Routine**:
A standing instruction to start a Task at a time or when something happens.
_Avoid_: schedule, cron, job, automation

**Schedule**:
The predesigned screen showing a Member's reminders, calendar and Routines.
_Avoid_: plans, agenda

**Artifact**:
A durable work product, such as a draft email, a recipe or a shopping list, that can be shown in a Widget on any Surface and edited.
_Avoid_: document, output, result

**Workspace**:
A named environment on a Node that work can target, such as a project with its tools or a printer.
_Avoid_: environment, project, sandbox

**Origin Node**:
The Node a request came from.
_Avoid_: source device

**Execution Node**:
The Node where the work for a request actually happens.
_Avoid_: target, worker, host

**Context envelope**:
The facts about now, who, where and Focus that accompany every turn a Role takes.
_Avoid_: system context, ambient context, metadata

**Conversation**:
The single main, ongoing dialogue between a Member and hux, continued from any Node.
_Avoid_: chat, session

**Thread**:
The inspectable dialogue belonging to one Task, separate from the Conversation and summarised back into it.
_Avoid_: sub-conversation, side chat

## Trust and safety

**Label**:
The record attached to a piece of data of where it came from and how sensitive it is.
_Avoid_: tag, taint, classification

**Action tier**:
How much Member involvement an action needs: done on its own, asked each time, pre-approved narrowly, or left to the Member.
_Avoid_: permission level, risk level

**Approval**:
A Member's decision to allow one exact action, given on a paired Node.
_Avoid_: confirmation, consent, permission

**Escalation policy**:
How hux raises the urgency of a notification over time until a Member acknowledges it.
_Avoid_: alert chain, retry

## Models

**Model endpoint**:
A place that serves models to hux: on a Node, on the network, or at a provider.
_Avoid_: provider, backend, LLM server

**Trust level**:
A Member's judgement of how sensitive the data a Model endpoint may see can be.
_Avoid_: privacy level, security level

**Model profile**:
What hux knows about a specific model: its limits, abilities and preferred settings per mode.
_Avoid_: model config, preset

**Decision**:
A fast, typed judgement about an input (intent, urgency, sensitivity, which Role) made before any Role starts.
_Avoid_: classification, routing, System 1 (as a noun)

## Extending hux

**Plugin**:
An installable package that gives hux new tools, sandboxed and limited to the permissions it declares.
_Avoid_: extension, add-on, app

**Skill**:
Installable know-how for Roles: instructions only, with no permissions of its own.
_Avoid_: prompt, recipe, playbook

**Driver**:
A Plugin or Connector that brings one family of home or vehicle devices into hux's device model.
_Avoid_: integration, adapter, bridge

**Device**:
A physical thing hux can observe or control through a Driver, such as a light, a plug, a car or a charger.
_Avoid_: entity, thing, appliance
