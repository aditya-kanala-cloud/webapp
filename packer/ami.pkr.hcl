
variable "aws_region" {
  type    = string
  default = env("AWS_DEFAULT_REGION")
}

variable "source_ami" {
  type    = string
  default = env("SOURCE_AMI")
}

variable "ssh_username" {
  type    = string
  default = env("SSH_USERNAME")
}

variable "subnet_id" {
  type    = string
  default = env("DEFAULT_SUBNET_ID")
}
source "amazon-ebs" "my-ami" {
  ami_name             = "csye6225_${formatdate("YYYY_MM_DD_hh_mm_ss", timestamp())}"
  source_ami           = "${var.source_ami}"
  instance_type        = "t2.micro"
  region               = "${var.aws_region}"
  ssh_username         = "${var.ssh_username}"
  ami_users            = ["111066921689","878965051243"]
  launch_block_device_mappings {
    delete_on_termination = true
    device_name           = "/dev/xvda"
    volume_size           = 8
    volume_type           = "gp2"
  }
}

build {
  sources = ["source.amazon-ebs.my-ami"]

  provisioner "file" {
    source      = "../webapp.zip"
    destination = "webapp.zip"
  }

  provisioner "shell" {
    script = "user_data.sh"
  }
}