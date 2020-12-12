# :loud_sound: Web Assembly + Web Audio = :green_heart:

This project aims to showcase the use of Web Assembly modules in AudioWorklets (amongst other things I wanted to give a try, like for instance the Web Midi API).

## :building_construction: Project Goal

Assemble a simple synth using in house (read "stolen here and there on the web") DSP algorithms written in C++ and exposed to the Web Audio API (using AudioWorklets) through Web Assembly.

## :alembic: Project Requirements

- Except for development dependency, the only required external JS library will be the [LitElement](https://lit-element.polymer-project.org/) library
- All C++ code will be written using the standard library (and emscripten bindings, of course)

## :construction: Work in progress

- Polish DSP algorithms
- Add a MIDI device selector
- Add a sequencer
