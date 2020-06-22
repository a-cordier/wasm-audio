# Web Assembly + Web Audio = :green_heart:

A simple project to showcase the use of Web Assembly modules in AudioWorklets (amongst other things I wanted to to give a go, like for instance the Web Midi API).

## Project Goal

Assemble a simple synth using in house (read "stolen here and there on the web") DSP algorithm written in C++ and exposed to the Web Audio API (using AudioWorklets) through Web Assembly. 

## Project Requirements

 - Except for development dependency, the only required external JS library will be the [LitElement](https://lit-element.polymer-project.org/) library
 - All C++ code will be written using the standard library (and emscripten bindings, of course)
