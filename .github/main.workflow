workflow "New workflow" {
  on = "push"
  resolves = ["Tests"]
}

action "Tests" {
  uses = "actions/npm@master"
  args = "test"
}
