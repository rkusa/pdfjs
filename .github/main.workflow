workflow "Continuous Testing" {
  on = "push"
  resolves = ["GitHub Action for npm"]
}

action "Install Dependencies" {
  uses = "actions/npm@master"
  args = "install"
}

action "GitHub Action for npm" {
  uses = "actions/npm@master"
  args = "test"
  needs = ["Install Dependencies"]
}
