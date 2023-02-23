
source "amazon-ebs" "my-ami" {
  ami_name      = "csye6225_${formatdate("YYYY_MM_DD_hh_mm_ss", timestamp())}"
  source_ami    = "ami-0dfcb1ef8550277af"
  instance_type = "t2.micro"
  region        = "us-east-1"
  ssh_username  = "ec2-user"
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
    source      = "/mnt/d/Cloud/Cloud Assignments/Assignment4/webapp.zip"
    destination = "webapp.zip"
  }

  provisioner "shell" {
    script = "./user_data.sh"
  }
}