# Prototype Progressive App

A prototype application to experiment building a progressive app.

## Requirements

 * Node JS 5.2.0
 * A browser that [supports Service Worker](http://caniuse.com/#feat=serviceworkers)

## Usage

```sh
$ npm install
$ npm start
```

The application is now serving at `http://localhost:3000/`.

## Tasks

#### Setup

  - [x] npm-based project with bower dependencies
  - [x] Express + Socket.io backend
  - [x] File-based data store
  - [x] Angular frontend with Jade templates
  - [x] Basic styling with bootstrap + google material design icons

#### Draft functionality

  - [x] Display online and offline drafts
  - [x] Indicate draft hasn't synced yet
  - [x] Order drafts by updated date/time
  - [x] Save drafts when online
  - [x] Save drafts when offline
  - [x] Edit online drafts when online
  - [x] Edit offline drafts when offline
  - [ ] Edit online drafts when offline
  - [x] Delete online drafts when online
  - [ ] Delete offline drafts when offline
  - [ ] Delete online drafts when offline
  - [ ] Offline draft changes sync when online again


#### Post functionality

  - [x] Display online and offline posts
  - [x] Indicate post hasn't synced yet
  - [x] Order posts by updated date/time
  - [x] Publish new posts when online
  - [x] Publish new posts when offline
  - [x] Edit online posts when online
  - [x] Edit offline posts when offline
  - [ ] Edit online posts when offline
  - [ ] Delete online posts when online
  - [ ] Delete offline posts when offline
  - [ ] Delete online posts when offline
  - [ ] Offline post changes sync when online again

#### State transitions

  - [x] Publish online post from online draft when online
  - [ ] Publish offline post from online draft when offline
  - [ ] Publish offline post from offline draft when offline
  - [ ] Withdraw online post to online draft when online
  - [ ] Withdraw online post to offline draft when offline
  - [ ] Withdraw offline post to offline draft when offline
