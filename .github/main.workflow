workflow "Continuous Testing" {
  on = "push"
  resolves = ["Tests"]
}

action "Install Dependencies" {
  uses = "actions/npm@master"
  args = "install"
}

action "Tests" {
  uses = "actions/npm@master"
  args = "test"
  needs = ["Install Dependencies"]
}
