# Random JWT secret
resource "random_password" "jwt_secret" {
  length  = 32
  special = true
}