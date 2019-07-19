#!/bin/bash
function gitzap() {
  git add . && git commit --allow-empty-message -m '' && git push $1 $2
}
